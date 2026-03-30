'use client';

import React, { useState, useEffect } from 'react';
import { 
  Save, X, Edit3, Image as ImageIcon, 
  Loader2, Check, AlertCircle, Trash2, 
  Plus, Upload, Globe, Type
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { contentAPI, uploadAPI } from '@/lib/api';
import { cn } from '@/lib/utils';

interface PlatformInlineEditorProps {
  page: string;
  initialContent: any[];
  onSave?: (updatedContent: any[]) => void;
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
}

export default function PlatformInlineEditor({ 
  page, 
  initialContent, 
  onSave,
  isEditing,
  setIsEditing
}: PlatformInlineEditorProps) {
  const [content, setContent] = useState<any[]>(initialContent);
  const [saving, setSaving] = useState(false);
  const [activeUpload, setActiveUpload] = useState<{ sectionKey: string; field: string } | null>(null);
  const [isChanged, setIsChanged] = useState(false);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const handleUpdate = (sectionKey: string, field: string, value: any) => {
    setContent(prev => prev.map(item => {
      if (item.section_key === sectionKey) {
        return {
          ...item,
          content: { ...item.content, [field]: value }
        };
      }
      return item;
    }));
    setIsChanged(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Ensure hospital_id is null for platform content
      const payload = content.map(item => ({
        ...item,
        page_path: page,
        hospital_id: null
      }));
      
      await contentAPI.update(payload);
      toast.success('Platform content published successfully!');
      setIsChanged(false);
      setIsEditing(false);
      if (onSave) onSave(content);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, sectionKey: string, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'platform-landing');

      const res: any = await uploadAPI.upload(formData);
      handleUpdate(sectionKey, field, res.url);
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setSaving(false);
      setActiveUpload(null);
    }
  };

  if (!isEditing && !isChanged) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-8 duration-500">
      <div className={cn(
        "bg-slate-900 text-white rounded-3xl p-2 pl-6 pr-4 flex items-center gap-6 shadow-2xl border border-white/10 backdrop-blur-xl",
        isChanged ? "ring-4 ring-primary-600/20" : ""
      )}>
        <div className="flex items-center gap-3 pr-4 border-r border-white/10">
          <div className={cn(
            "w-10 h-10 rounded-2xl flex items-center justify-center transition-all",
            isChanged ? "bg-primary-600 text-white" : "bg-white/10 text-slate-400"
          )}>
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : (isChanged ? <Edit3 className="w-5 h-5" /> : <Globe className="w-5 h-5" />)}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Platform Editor</p>
            <p className="text-xs font-bold">{isChanged ? 'Unsaved Changes' : 'Ready to Edit'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isChanged ? (
             <button 
                onClick={() => setIsEditing(false)}
                className="px-4 py-3 hover:bg-white/5 rounded-2xl text-xs font-bold transition-all uppercase tracking-widest"
             >
               Close Editor
             </button>
          ) : (
             <>
                <button 
                  onClick={() => {
                    setContent(initialContent);
                    setIsChanged(false);
                  }}
                  className="px-4 py-3 hover:bg-rose-500/10 text-rose-400 rounded-2xl text-xs font-bold transition-all uppercase tracking-widest"
                >
                  Discard
                </button>
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary py-3 px-8 rounded-2xl text-xs font-bold min-w-[140px] shadow-lg shadow-primary-600/20"
                >
                  {saving ? 'Publishing...' : 'Publish Changes'}
                </button>
             </>
          )}
        </div>
      </div>
    </div>
  );
}

// Editable Section Wrapper
export function EditableSection({ 
    sectionKey, 
    isEditing, 
    children, 
    title = sectionKey,
    onEditImage
}: { 
    sectionKey: string; 
    isEditing: boolean; 
    children: React.ReactNode;
    title?: string;
    onEditImage?: (field: string) => void;
}) {
    if (!isEditing) return <>{children}</>;

    return (
        <div className="relative group/editable border-2 border-transparent hover:border-primary-600/30 rounded-[3rem] transition-all p-2 -m-2">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 opacity-0 group-hover/editable:opacity-100 transition-all z-20 pointer-events-none">
                <div className="bg-primary-600 text-white text-[10px] font-black uppercase tracking-[0.3em] px-6 py-2 rounded-full shadow-lg whitespace-nowrap">
                    Edit {title}
                </div>
            </div>
            {children}
        </div>
    );
}

// Inline Text Editor
export function InlineText({ 
    value, 
    onChange, 
    isEditing, 
    className,
    multiline = false
}: { 
    value: string; 
    onChange: (val: string) => void; 
    isEditing: boolean;
    className?: string;
    multiline?: boolean;
}) {
    if (!isEditing) return <span className={className}>{value}</span>;

    if (multiline) {
        return (
            <textarea 
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={cn("bg-primary-600/5 hover:bg-primary-600/10 focus:bg-white focus:ring-2 focus:ring-primary-600 border-none outline-none transition-all rounded-xl p-2 w-full", className)}
            />
        );
    }

    return (
        <input 
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cn("bg-primary-600/5 hover:bg-primary-600/10 focus:bg-white focus:ring-2 focus:ring-primary-600 border-none outline-none transition-all rounded-xl px-2 inline-block max-w-full", className)}
        />
    );
}

// Inline Image Editor
export function InlineImage({
    url,
    onChange,
    isEditing,
    className,
    alt = "Image"
}: {
    url: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isEditing: boolean;
    className?: string;
    alt?: string;
}) {
    const inputRef = React.useRef<HTMLInputElement>(null);

    return (
        <div className="relative group/img-edit inline-block">
            <img src={url} alt={alt} className={className} />
            {isEditing && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img-edit:opacity-100 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer rounded-[inherit]"
                     onClick={() => inputRef.current?.click()}>
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-900 shadow-xl group-hover/img-edit:scale-110 transition-transform">
                        <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Change Image</p>
                    <input 
                        ref={inputRef}
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={onChange}
                    />
                </div>
            )}
        </div>
    );
}
