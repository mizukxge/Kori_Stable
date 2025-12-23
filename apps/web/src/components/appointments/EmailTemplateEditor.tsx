import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from '../ui/Button';
import { Label } from '../ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { X, Copy, RotateCcw } from 'lucide-react';

interface EmailTemplateEditorProps {
  templateName: string;
  templateType: 'invitation' | 'confirmation' | 'reminder';
  initialValue: string;
  onSave: (content: string) => void;
  onClose: () => void;
}

const TEMPLATE_VARIABLES = {
  invitation: [
    '{clientName}',
    '{appointmentType}',
    '{proposedDate}',
    '{proposedTime}',
    '{bookingLink}',
    '{adminName}',
  ],
  confirmation: [
    '{clientName}',
    '{confirmedDate}',
    '{confirmedTime}',
    '{teamsLink}',
    '{calendarFile}',
    '{adminName}',
  ],
  reminder: [
    '{clientName}',
    '{appointmentDate}',
    '{appointmentTime}',
    '{teamsLink}',
    '{adminName}',
  ],
};

const DEFAULT_TEMPLATES = {
  invitation: `Hi {clientName},

You're invited to a {appointmentType} call on {proposedDate} at {proposedTime}.

Please confirm your availability:
{bookingLink}

Best regards,
{adminName}`,
  confirmation: `Hi {clientName},

Your appointment is confirmed for {confirmedDate} at {confirmedTime}.

Teams Link: {teamsLink}

Best regards,
{adminName}`,
  reminder: `Hi {clientName},

Reminder: Your appointment is on {appointmentDate} at {appointmentTime}.

Teams Link: {teamsLink}

Best regards,
{adminName}`,
};

export function EmailTemplateEditor({
  templateName,
  templateType,
  initialValue,
  onSave,
  onClose,
}: EmailTemplateEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        horizontalRule: false,
        codeBlock: false,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: 'Enter email template...',
      }),
    ],
    content: initialValue,
    onUpdate: () => {
      setHasChanges(true);
    },
  });

  const handleSave = async () => {
    if (!editor) return;
    setIsSaving(true);
    const content = editor.getHTML();

    try {
      onSave(content);
      setHasChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (!editor) return;
    if (confirm('Reset to default template?')) {
      editor.commands.setContent(DEFAULT_TEMPLATES[templateType]);
      setHasChanges(true);
    }
  };

  const handleInsertVariable = (variable: string) => {
    if (!editor) return;
    editor.commands.insertContent(variable);
  };

  const copyVariable = (variable: string) => {
    navigator.clipboard.writeText(variable);
  };

  if (!editor) {
    return null;
  }

  const availableVariables = TEMPLATE_VARIABLES[templateType];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <CardHeader className="flex items-center justify-between pb-4">
          <div>
            <CardTitle>{templateName}</CardTitle>
            <CardDescription>
              Customize the email template with available variables
            </CardDescription>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-muted p-1 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Template Variables */}
          <div>
            <Label className="block mb-2">Available Variables</Label>
            <div className="flex flex-wrap gap-2">
              {availableVariables.map((variable) => (
                <button
                  key={variable}
                  onClick={() => handleInsertVariable(variable)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    copyVariable(variable);
                  }}
                  title="Click to insert, right-click to copy"
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition"
                >
                  {variable}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Click to insert, right-click to copy
            </p>
          </div>

          {/* Editor */}
          <div>
            <Label className="block mb-2">Template Content</Label>
            <div className="border rounded-lg bg-white p-4 min-h-64">
              <EditorContent editor={editor} className="prose prose-sm max-w-none" />
            </div>
          </div>

          {/* Formatting Toolbar */}
          <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg border">
            <Button
              size="sm"
              variant={editor.isActive('bold') ? 'default' : 'outline'}
              onClick={() => editor.chain().focus().toggleBold().run()}
              disabled={!editor.can().chain().focus().toggleBold().run()}
            >
              <strong>B</strong>
            </Button>
            <Button
              size="sm"
              variant={editor.isActive('italic') ? 'default' : 'outline'}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              disabled={!editor.can().chain().focus().toggleItalic().run()}
            >
              <em>I</em>
            </Button>
            <Button
              size="sm"
              variant={editor.isActive('bulletList') ? 'default' : 'outline'}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              • List
            </Button>
            <Button
              size="sm"
              variant={editor.isActive('orderedList') ? 'default' : 'outline'}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              1. List
            </Button>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={handleReset}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Default
            </Button>
            <div className="flex-1" />
            <Button
              onClick={onClose}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
            >
              {isSaving ? 'Saving...' : 'Save Template'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
