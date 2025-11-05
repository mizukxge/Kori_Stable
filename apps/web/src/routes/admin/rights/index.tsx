import React, { useState, useEffect } from 'react';
import {
  getRightsPresets,
  createRightsPreset,
  updateRightsPreset,
  deleteRightsPreset,
  type RightsPreset,
} from '../../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Label } from '../../../components/ui/Label';
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  Star,
  Copyright,
  MapPin,
  Tag,
} from 'lucide-react';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';

export default function RightsPresetsPage() {
  const [presets, setPresets] = useState<RightsPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<RightsPreset | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [presetToDelete, setPresetToDelete] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    creator: '',
    copyrightNotice: '',
    usageRights: '',
    creditLine: '',
    instructions: '',
    city: '',
    state: '',
    country: '',
    keywords: '',
    isDefault: false,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const loadPresets = async () => {
    try {
      const response = await getRightsPresets(true);
      setPresets(response.data);
      console.log(`✅ Loaded ${response.data.length} rights presets`);
    } catch (error) {
      console.error('❌ Failed to load rights presets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPresets();
  }, []);

  const openCreateModal = () => {
    setEditingPreset(null);
    setFormData({
      name: '',
      description: '',
      creator: 'Mizu Studio',
      copyrightNotice: '© 2025 Mizu Studio. All Rights Reserved.',
      usageRights: 'Editorial use only',
      creditLine: 'Photo by Mizu Studio',
      instructions: '',
      city: '',
      state: '',
      country: 'US',
      keywords: '',
      isDefault: false,
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (preset: RightsPreset) => {
    setEditingPreset(preset);
    setFormData({
      name: preset.name,
      description: preset.description || '',
      creator: preset.creator,
      copyrightNotice: preset.copyrightNotice,
      usageRights: preset.usageRights,
      creditLine: preset.creditLine || '',
      instructions: preset.instructions || '',
      city: preset.city || '',
      state: preset.state || '',
      country: preset.country || '',
      keywords: preset.keywords.join(', '),
      isDefault: preset.isDefault,
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.creator.trim()) errors.creator = 'Creator is required';
    if (!formData.copyrightNotice.trim()) errors.copyrightNotice = 'Copyright notice is required';
    if (!formData.usageRights.trim()) errors.usageRights = 'Usage rights are required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const data = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        creator: formData.creator.trim(),
        copyrightNotice: formData.copyrightNotice.trim(),
        usageRights: formData.usageRights.trim(),
        creditLine: formData.creditLine.trim() || undefined,
        instructions: formData.instructions.trim() || undefined,
        city: formData.city.trim() || undefined,
        state: formData.state.trim() || undefined,
        country: formData.country || undefined,
        keywords: formData.keywords
          .split(',')
          .map((k) => k.trim())
          .filter((k) => k.length > 0),
        isDefault: formData.isDefault,
      };

      if (editingPreset) {
        await updateRightsPreset(editingPreset.id, data);
        console.log('✅ Rights preset updated');
      } else {
        await createRightsPreset(data);
        console.log('✅ Rights preset created');
      }

      setModalOpen(false);
      await loadPresets();
    } catch (error) {
      console.error('❌ Failed to save rights preset:', error);
      alert(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!presetToDelete) return;

    try {
      await deleteRightsPreset(presetToDelete);
      console.log('✅ Rights preset deleted');
      setDeleteConfirmOpen(false);
      setPresetToDelete(null);
      await loadPresets();
    } catch (error) {
      console.error('❌ Failed to delete rights preset:', error);
      alert('Failed to delete preset. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">Loading rights presets...</p>
      </div>
    );
  }

  return (
    <>
      {/* Modal - Rendered at top level to cover entire page */}
      {modalOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-modal-backdrop"
            onClick={() => setModalOpen(false)}
          />

          {/* Modal Container */}
          <div
            className="fixed inset-0 flex flex-col items-center justify-start z-modal p-4 pt-12 overflow-y-auto scrollbar-thin pointer-events-none"
          >
            <div onClick={(e) => e.stopPropagation()} className="w-full max-w-3xl pointer-events-auto">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      {editingPreset ? 'Edit Rights Preset' : 'Create Rights Preset'}
                    </CardTitle>
                    <CardDescription>
                      Copyright and usage rights template for your photos
                    </CardDescription>
                  </div>
                  <button onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">Basic Information</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2 space-y-2">
                      <Label htmlFor="name">
                        Preset Name <span className="text-destructive">*</span>
                      </Label>
                      <input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground ${formErrors.name ? 'border-red-500' : 'border-input'}`}
                        placeholder="e.g., Wedding Photography Standard"
                      />
                      {formErrors.name && <p className="text-sm text-destructive">{formErrors.name}</p>}
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg min-h-[60px]"
                        placeholder="Optional description of this preset"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="isDefault" className="cursor-pointer">
                      Set as default preset
                    </Label>
                  </div>
                </div>

                {/* Copyright Fields */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">Copyright Information</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="creator">
                        Creator <span className="text-destructive">*</span>
                      </Label>
                      <input
                        id="creator"
                        value={formData.creator}
                        onChange={(e) => setFormData({ ...formData, creator: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground ${formErrors.creator ? 'border-red-500' : 'border-input'}`}
                        placeholder="Photographer or Studio name"
                      />
                      {formErrors.creator && <p className="text-sm text-destructive">{formErrors.creator}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="copyrightNotice">
                        Copyright Notice <span className="text-destructive">*</span>
                      </Label>
                      <input
                        id="copyrightNotice"
                        value={formData.copyrightNotice}
                        onChange={(e) => setFormData({ ...formData, copyrightNotice: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground ${formErrors.copyrightNotice ? 'border-red-500' : 'border-input'}`}
                        placeholder="© 2025 Your Name. All Rights Reserved."
                      />
                      {formErrors.copyrightNotice && <p className="text-sm text-destructive">{formErrors.copyrightNotice}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="usageRights">
                        Usage Rights <span className="text-destructive">*</span>
                      </Label>
                      <textarea
                        id="usageRights"
                        value={formData.usageRights}
                        onChange={(e) => setFormData({ ...formData, usageRights: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg min-h-[80px] bg-background text-foreground ${formErrors.usageRights ? 'border-red-500' : 'border-input'}`}
                        placeholder="e.g., Editorial use only, Commercial use with restrictions, etc."
                      />
                      {formErrors.usageRights && <p className="text-sm text-destructive">{formErrors.usageRights}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="creditLine">Credit Line</Label>
                      <input
                        id="creditLine"
                        value={formData.creditLine}
                        onChange={(e) => setFormData({ ...formData, creditLine: e.target.value })}
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                        placeholder="Photo by..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="instructions">Instructions</Label>
                      <textarea
                        id="instructions"
                        value={formData.instructions}
                        onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                        className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg min-h-[60px]"
                        placeholder="Special instructions for usage..."
                      />
                    </div>
                  </div>
                </div>

                {/* Location & Keywords */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">Location & Keywords</h3>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <input
                        id="state"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <input
                        id="country"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="keywords">Keywords</Label>
                    <input
                      id="keywords"
                      value={formData.keywords}
                      onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                      className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                      placeholder="wedding, portrait, commercial (comma separated)"
                    />
                    <p className="text-xs text-muted-foreground">Separate keywords with commas</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" className="flex-1" onClick={() => setModalOpen(false)} disabled={submitting}>
                    Cancel
                  </Button>
                  <Button className="flex-1" onClick={handleSubmit} disabled={submitting}>
                    <Save className="w-4 h-4 mr-2" />
                    {submitting ? 'Saving...' : editingPreset ? 'Update Preset' : 'Create Preset'}
                  </Button>
                </div>
              </CardContent>
            </Card>
            </div>
          </div>
        </>
      )}

      {/* Content - Main page container */}
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Rights Presets</h1>
            <p className="mt-2 text-base sm:text-lg text-muted-foreground">
              Manage copyright and usage rights templates
            </p>
          </div>
          <Button onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-2" />
            Create Preset
          </Button>
        </div>

      {/* Presets Grid */}
      {presets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
              <Shield className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">No Rights Presets Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Create your first rights preset to quickly apply copyright and usage rights to your photos.
            </p>
            <Button onClick={openCreateModal}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Preset
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {presets.map((preset) => (
            <Card key={preset.id} className="relative">
              {preset.isDefault && (
                <div className="absolute top-4 right-4">
                  <Star className="w-5 h-5 text-warning fill-yellow-500" />
                </div>
              )}
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Copyright className="w-5 h-5" />
                  {preset.name}
                </CardTitle>
                {preset.description && (
                  <CardDescription>{preset.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Creator</p>
                  <p className="text-sm">{preset.creator}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Copyright Notice</p>
                  <p className="text-sm">{preset.copyrightNotice}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Usage Rights</p>
                  <p className="text-sm">{preset.usageRights}</p>
                </div>
                {preset.keywords.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Keywords</p>
                    <div className="flex flex-wrap gap-1">
                      {preset.keywords.slice(0, 3).map((keyword, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-primary/10 text-primary"
                        >
                          <Tag className="w-3 h-3" />
                          {keyword}
                        </span>
                      ))}
                      {preset.keywords.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{preset.keywords.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditModal(preset)}>
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-red-50"
                    onClick={() => {
                      setPresetToDelete(preset.id);
                      setDeleteConfirmOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Delete Rights Preset?"
        message="Are you sure you want to delete this rights preset? This will not affect photos that already have this metadata embedded."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setPresetToDelete(null);
        }}
      />
      </div>
    </>
  );
}
