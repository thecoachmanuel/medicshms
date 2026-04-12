import { supabaseAdmin, supabase } from '../supabase';

export interface AIResponse {
  text: string;
  tools?: ToolCall[];
}

export interface ToolCall {
  name: string;
  parameters: any;
}

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const DEFAULT_MODEL = 'qwen2:1.5b'; // Lightweight and fast for tools

export const AIAgent = {
  async chat(prompt: string, context: { userId: string; hospitalId: string; role: string }, stream = false): Promise<any> {
    const systemPrompt = `
      You are Medics AI, a professional and proactive hospital assistant for a Hospital Management System.
      You help staff manage their workflow efficiently.
      
      Your available tools (respond with JSON in <tool> tags if you need them):
      1. create_todo(task: string, priority: string, due_date?: string): Create a task for the user.
      2. list_todos(): Get the user's current tasks.
      3. fetch_notifications(): Read recent alerts for the user.
      4. get_upcoming_events(): Check the hospital's event calendar.

      Context:
      Current User ID: ${context.userId}
      Hospital ID: ${context.hospitalId}
      Role: ${context.role}

      Rules:
      - Always be helpful and brief.
      - If you use a tool, wrap the JSON command in <tool>{"name": "tool_name", "parameters": {...}}</tool>.
      - Use standard hospital terminology.
    `;

    try {
      const response = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          prompt: `${systemPrompt}\nUser: ${prompt}\nAssistant:`,
          stream: stream,
          format: 'json'
        }),
      });

      if (!response.ok) throw new Error('Ollama connection failed. Ensure Ollama is running.');

      if (stream) return response;

      const data = await response.json();
      const content = data.response;
      
      // Parse potential tool calls
      const toolMatch = content.match(/<tool>([\s\S]*?)<\/tool>/);
      let tools: ToolCall[] = [];
      let text = content.replace(/<tool>[\s\S]*?<\/tool>/g, '').trim();

      if (toolMatch) {
        try {
          const toolData = JSON.parse(toolMatch[1]);
          tools.push(toolData);
          await this.executeTool(toolData, context);
          text += `\n\n[Action Performed: ${toolData.name}]`;
        } catch (e) {
          console.error('Tool parsing error:', e);
        }
      }

      return { text, tools };
    } catch (error: any) {
      console.error('AI Agent Error:', error);
      return { text: "I'm having trouble connecting to my local brain (Ollama). Please ensure it is running and accessible." };
    }
  },

  async executeTool(tool: ToolCall, context: { userId: string; hospitalId: string }) {
    const client = supabaseAdmin || supabase;

    switch (tool.name) {
      case 'create_todo':
        return await client.from('todos').insert([{
          user_id: context.userId,
          hospital_id: context.hospitalId,
          task: tool.parameters.task,
          priority: tool.parameters.priority || 'Medium',
          due_date: tool.parameters.due_date
        }]);

      case 'list_todos':
        return await client.from('todos')
          .select('*')
          .eq('user_id', context.userId)
          .eq('is_completed', false)
          .order('created_at', { ascending: false });

      case 'fetch_notifications':
        return await client.from('notifications')
          .select('*')
          .eq('user_id', context.userId)
          .order('created_at', { ascending: false })
          .limit(5);

      case 'get_upcoming_events':
        return await client.from('hospital_events')
          .select('*')
          .eq('hospital_id', context.hospitalId)
          .gte('event_date', new Date().toISOString())
          .order('event_date', { ascending: true });

      default:
        return null;
    }
  }
};
