import { useState } from 'react';
import { Save, X, Plus, Trash2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';

interface ClientNotesPanelProps {
  notes: string | null;
  tags: string[];
  onSave: (notes: string, tags: string[]) => Promise<void>;
  loading?: boolean;
}

export function ClientNotesPanel({ notes: initialNotes, tags: initialTags, onSave, loading = false }: ClientNotesPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(initialNotes || '');
  const [tags, setTags] = useState<string[]>(initialTags || []);
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddTag = () => {
    const trimmedTag = newTag.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(notes, tags);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save notes and tags');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setNotes(initialNotes || '');
    setTags(initialTags || []);
    setNewTag('');
    setIsEditing(false);
    setError(null);
  };

  if (!isEditing) {
    return (
      <div className="space-y-4">
        {/* Notes Card */}
        {notes && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base">Notes</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Tags Card */}
        {tags.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base">Tags</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Notes Button */}
        {!notes && (
          <Card>
            <CardContent className="pt-6">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsEditing(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Notes & Tags
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Edit mode
  return (
    <Card className="border-primary/50">
      <CardHeader>
        <CardTitle>Edit Notes & Tags</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Notes Section */}
        <div className="space-y-2">
          <label htmlFor="notes" className="text-sm font-medium">
            Notes (Scratchpad)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this client..."
            className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-lg min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          <p className="text-xs text-muted-foreground">
            {notes.length} characters
          </p>
        </div>

        {/* Tags Section */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Tags</label>

          {/* Tag Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddTag();
                }
              }}
              placeholder="Type a tag and press Enter or click Add"
              className="flex-1 px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Button
              type="button"
              onClick={handleAddTag}
              variant="outline"
              disabled={!newTag.trim()}
            >
              Add
            </Button>
          </div>

          {/* Tags List */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:opacity-70 transition-opacity"
                    title="Remove tag"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {tags.length} tag{tags.length !== 1 ? 's' : ''} added
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 border-t pt-6">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={saving || loading}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || loading}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
