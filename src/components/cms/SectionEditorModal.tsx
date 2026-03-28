'use client';

import React, { useState } from 'react';
import { X, Save, Loader2, Type, Image as ImageIcon, Plus, Trash2, GripVertical, Upload } from 'lucide-react';
import { contentAPI, uploadAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { SECTION_SCHEMAS, DEFAULT_CONTENT, LIST_ITEM_SCHEMAS } from '@/lib/cms-schemas';

interface SectionEditorModalProps {
  pagePath: string;
  sectionKey: string;
  initialContent: any;
  onClose: () => void;
  onSave: () => void;
}

export default function SectionEditorModal({ 
  pagePath, 
  sectionKey, 
  initialContent, 
  onClose, 
  onSave 
}: SectionEditorModalProps) {
  const schema = SECTION_SCHEMAS[sectionKey] || {};
  const defaults = DEFAULT_CONTENT[sectionKey] || {};
  
  const [content, setContent] = useState(() => {
    const base = (initialContent && (Array.isArray(initialContent) ? initialContent.length > 0 : Object.keys(initialContent).length > 0)) 
      ? initialContent 
      : defaults;
    
    if (Array.isArray(base)) return base;

    const fullContent = { ...base };
    Object.keys(schema).forEach(key => {
      if (fullContent[key] === undefined) {
        fullContent[key] = defaults[key] || (schema[key] === 'list' ? [] : '');
      }
    });
    return fullContent;
  });

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const handleFileUpload = async (file: File, key: string, callback: (url: string) => void) => {
    try {
      setUploading(key);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', `cms/${sectionKey}`);
      
      const res = await uploadAPI.upload(formData) as any;
      callback(res.url);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await contentAPI.update([{
        page_path: pagePath,
        section_key: sectionKey,
        content: content
      }]);
      toast.success('Section updated successfully');
      onSave();
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const renderField = (key: string, type: string, value: any, onChange: (val: any) => void) => {
    const label = key.split('_').join(' ');
    
    // Handle Nested Objects (Recursive)
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return (
        <div key={key} className="space-y-4 p-6 rounded-[2rem] bg-gray-50/50 border border-gray-100">
          <label className="text-[10px] font-black text-primary-600 uppercase tracking-widest pl-1">{label}</label>
          <div className="space-y-4">
            {Object.keys(value).map(childKey => 
              renderField(
                childKey, 
                typeof value[childKey] === 'string' && value[childKey].length > 50 ? 'textarea' : 'text', 
                value[childKey], 
                (childVal) => onChange({ ...value, [childKey]: childVal })
              )
            )}
          </div>
        </div>
      );
    }

    if (type === 'list' || Array.isArray(value)) {
      return renderListField(key, value || [], onChange);
    }

    return (
      <div key={key} className="space-y-2 group">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 group-hover:text-primary-600 transition-colors">
          {label}
        </label>
        
        {type === 'textarea' ? (
          <textarea 
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="input py-3 min-h-[100px] bg-gray-50/50 focus:bg-white transition-colors text-sm"
            placeholder={`Enter ${label}...`}
          />
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <input 
                type="text" 
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                className="input py-3 bg-gray-50/50 focus:bg-white transition-colors text-sm pr-24"
                placeholder={`Enter ${label} URL...`}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {type === 'image' && (
                  <label className="p-2 hover:bg-white rounded-lg cursor-pointer transition-colors text-primary-600">
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, key, onChange);
                      }}
                    />
                    {uploading === key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  </label>
                )}
                {type !== 'image' && <Type className="w-4 h-4 text-gray-300 mr-2" />}
              </div>
            </div>
            {type === 'image' && value && (
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 group/img">
                <img 
                  src={value} 
                  alt={label} 
                  className="w-full h-full object-cover transition-transform group-hover/img:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Invalid+Image+URL';
                  }}
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                   <p className="text-[10px] font-black text-white uppercase tracking-widest">Live Preview</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderListField = (key: string, list: any[], onListChange: (newList: any[]) => void) => {
    // Attempt to find a schema for list items
    let itemSchema = LIST_ITEM_SCHEMAS[sectionKey] || LIST_ITEM_SCHEMAS[key];
    
    // If no schema, but we have items, infer from first item
    if (!itemSchema && list.length > 0 && typeof list[0] === 'object') {
      itemSchema = {};
      Object.keys(list[0]).forEach(k => {
        itemSchema![k] = typeof list[0][k] === 'string' && list[0][k].length > 50 ? 'textarea' : 'text';
      });
    }

    // Default fallback if still no schema
    if (!itemSchema) {
      itemSchema = { label: 'text', value: 'text' };
    }
    
    const addItem = () => {
      const newItem: any = {};
      Object.keys(itemSchema!).forEach(k => {
        newItem[k] = '';
      });
      onListChange([...list, newItem]);
    };

    const removeItem = (idx: number) => {
      const newList = [...list];
      newList.splice(idx, 1);
      onListChange(newList);
    };

    const updateItem = (idx: number, field: string, val: string) => {
      const newList = [...list];
      newList[idx] = { ...newList[idx], [field]: val };
      onListChange(newList);
    };

    return (
      <div key={key} className="space-y-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em]">
            {key.split('_').join(' ')} ({list.length} items)
          </label>
        </div>

        <div className="space-y-4">
          {list.map((item, idx) => (
            <div key={idx} className="p-6 rounded-3xl bg-gray-50/50 border border-gray-100 space-y-4 relative group hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 transition-all">
              <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => removeItem(idx)}
                  className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {typeof item === 'object' ? Object.keys(itemSchema!).map(fieldKey => (
                  <div key={fieldKey} className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">{fieldKey.replace('_', ' ')}</label>
                    {itemSchema![fieldKey] === 'textarea' ? (
                      <textarea
                        value={item[fieldKey] || ''}
                        onChange={(e) => updateItem(idx, fieldKey, e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all min-h-[60px]"
                      />
                    ) : (
                      <div className="relative">
                        <input 
                          type="text"
                          value={item[fieldKey] || ''}
                          onChange={(e) => updateItem(idx, fieldKey, e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                        />
                        {itemSchema![fieldKey] === 'image' && <ImageIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300" />}
                      </div>
                    )}
                  </div>
                )) : (
                  <input 
                    type="text"
                    value={item || ''}
                    onChange={(e) => {
                      const newList = [...list];
                      newList[idx] = e.target.value;
                      onListChange(newList);
                    }}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  />
                )}
              </div>
            </div>
          ))}

          <button 
            type="button"
            onClick={addItem}
            className="w-full py-4 rounded-3xl border-2 border-dashed border-gray-200 text-gray-400 text-xs font-bold hover:border-primary-500 hover:text-primary-600 hover:bg-primary-50/30 transition-all flex items-center justify-center gap-2 group"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" /> Add New Item
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col scale-in-center">
        <div className="px-10 py-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h2 className="text-2xl font-black text-gray-900 capitalize italic tracking-tight">
              Edit {sectionKey.split('_').join(' ')}
            </h2>
            <p className="text-[10px] font-black text-primary-600 uppercase tracking-[0.3em] mt-1">MedicsCMS • Live Site Editor</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl transition-colors shadow-sm scale-hover">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-10 py-10 space-y-8 custom-scrollbar">
          {Array.isArray(content) ? (
            renderListField(sectionKey, content, setContent)
          ) : (
            Object.keys(schema).length > 0 ? (
              Object.keys(schema).map(key => renderField(key, schema[key], content[key], (val) => setContent({ ...content, [key]: val })))
            ) : (
              Object.keys(content).map(key => renderField(key, typeof content[key] === 'string' && content[key].length > 50 ? 'textarea' : 'text', content[key], (val) => setContent({ ...content, [key]: val })))
            )
          )}
        </div>

        <div className="px-10 py-8 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-4">
          <button onClick={onClose} className="px-8 py-3 rounded-2xl text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">Cancel</button>
          <button 
            onClick={handleSave} 
            disabled={saving} 
            className="bg-primary-600 text-white min-w-[200px] py-4 rounded-2xl shadow-xl shadow-primary-600/20 active:scale-95 transition-all font-bold flex items-center justify-center gap-2 hover:bg-primary-700"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Publish Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}
