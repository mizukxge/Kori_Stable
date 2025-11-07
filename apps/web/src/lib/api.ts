const API_BASE_URL = 'http://localhost:3002';

export interface UploadResponse {
  success: boolean;
  data: {
    id: string;
    filename: string;
    category: string;
    path: string;
    thumbnailPath?: string;
    mimeType: string;
    size: number;
  };
}

export interface AddAssetsResponse {
  success: boolean;
  message: string;
  data: {
    galleryId: string;
    addedCount: number;
  };
}

export interface Gallery {
  id: string;
  name: string;
  description?: string;
  token: string;
  assets: Array<{
    asset: {
      id: string;
      filename: string;
      path: string;
      thumbnailPath?: string;
      mimeType: string;
      category: string;
    };
  }>;
}
export async function setGalleryCoverPhoto(
  galleryId: string,
  assetId: string | null
): Promise<{ success: boolean; message: string; data: any }> {
  const response = await fetch(
    `${API_BASE_URL}/admin/galleries/${galleryId}/cover`,
    {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ assetId }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to set cover photo');
  }

  return response.json();
}

export interface GalleryResponse {
  success: boolean;
  data: Gallery;
}

export async function uploadAsset(file: File, clientId?: string): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (clientId) {
    formData.append('clientId', clientId);
  }

  const response = await fetch(`${API_BASE_URL}/admin/assets/upload`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Upload failed');
  }

  return response.json();
}
export async function removeAssetFromGallery(
  galleryId: string,
  assetId: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(
    `${API_BASE_URL}/admin/galleries/${galleryId}/assets/${assetId}`,
    {
      method: 'DELETE',
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to remove photo');
  }

  return response.json();
}

export async function addAssetsToGallery(
  galleryId: string,
  assetIds: string[]
): Promise<AddAssetsResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/galleries/${galleryId}/assets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ assetIds }),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to add assets to gallery');
  }

  return response.json();
}

export async function getGallery(galleryId: string): Promise<GalleryResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/galleries/${galleryId}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch gallery');
  }

  return response.json();
}

export async function createGallery(data: {
  name: string;
  description?: string;
  clientId?: string;
}): Promise<{ success: boolean; data: any }> {
  const response = await fetch(`${API_BASE_URL}/admin/galleries`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create gallery');
  }

  return response.json();
}

export async function getAllGalleries(): Promise<{ success: boolean; data: any[] }> {
  const response = await fetch(`${API_BASE_URL}/admin/galleries`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch galleries');
  }

  return response.json();
}
export async function toggleGalleryAssetFavorite(
  galleryId: string,
  assetId: string,
  isFavorite: boolean
): Promise<{ success: boolean; data: any }> {
  const response = await fetch(
    `${API_BASE_URL}/admin/galleries/${galleryId}/assets/${assetId}/favorite`,
    {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isFavorite }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to toggle favorite');
  }

  return response.json();
}
export async function updateGalleryPassword(
  galleryId: string,
  password: string | null
): Promise<{ success: boolean; message: string; data: any }> {
  const response = await fetch(
    `${API_BASE_URL}/admin/galleries/${galleryId}/password`,
    {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update password');
  }

  return response.json();
}
export async function deleteGallery(
  galleryId: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(
    `${API_BASE_URL}/admin/galleries/${galleryId}`,
    {
      method: 'DELETE',
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete gallery');
  }

  return response.json();
}
export async function updateGallery(
  galleryId: string,
  data: { name?: string; description?: string }
): Promise<{ success: boolean; message: string; data: any }> {
  const response = await fetch(
    `${API_BASE_URL}/admin/galleries/${galleryId}`,
    {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update gallery');
  }

  return response.json();
}

export async function reorderGalleryAssets(
  galleryId: string,
  assetIds: string[]
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(
    `${API_BASE_URL}/admin/galleries/${galleryId}/reorder`,
    {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ assetIds }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to reorder assets');
  }

  return response.json();
}

export async function logout(): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to logout');
  }

  return response.json();
}

// ==================== CLIENT MANAGEMENT ====================

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'ARCHIVED';
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ClientListResponse {
  success: boolean;
  data: Client[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ClientResponse {
  success: boolean;
  data: Client;
}

export interface ClientStatsResponse {
  success: boolean;
  data: {
    total: number;
    byStatus: {
      active: number;
      inactive: number;
      pending: number;
      archived: number;
    };
  };
}

export async function getClients(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<ClientListResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());
  if (params?.search) query.append('search', params.search);
  if (params?.status) query.append('status', params.status);
  if (params?.sortBy) query.append('sortBy', params.sortBy);
  if (params?.sortOrder) query.append('sortOrder', params.sortOrder);

  const response = await fetch(`${API_BASE_URL}/admin/clients?${query}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch clients');
  }

  return response.json();
}

export async function getClient(id: string): Promise<ClientResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/clients/${id}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch client');
  }

  return response.json();
}

export async function createClient(data: {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  notes?: string;
  tags?: string[];
}): Promise<ClientResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/clients`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create client');
  }

  return response.json();
}

export async function updateClient(
  id: string,
  data: Partial<{
    name: string;
    email: string;
    phone?: string;
    company?: string;
    status?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    notes?: string;
    tags?: string[];
  }>
): Promise<ClientResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/clients/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update client');
  }

  return response.json();
}

export async function updateClientStatus(
  id: string,
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'ARCHIVED'
): Promise<ClientResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/clients/${id}/status`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update client status');
  }

  return response.json();
}

export async function deleteClient(id: string): Promise<ClientResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/clients/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete client');
  }

  return response.json();
}

export async function getClientStats(): Promise<ClientStatsResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/clients/stats`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch client stats');
  }

  return response.json();
}

// ==================== RIGHTS PRESETS & METADATA ====================

export interface RightsPreset {
  id: string;
  name: string;
  description?: string;
  creator: string;
  copyrightNotice: string;
  usageRights: string;
  creditLine?: string;
  instructions?: string;
  city?: string;
  state?: string;
  country?: string;
  keywords: string[];
  isDefault: boolean;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface RightsPresetListResponse {
  success: boolean;
  data: RightsPreset[];
}

export interface RightsPresetResponse {
  success: boolean;
  data: RightsPreset;
  message?: string;
}

export async function getRightsPresets(activeOnly: boolean = true): Promise<RightsPresetListResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/rights-presets?activeOnly=${activeOnly}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch rights presets');
  }

  return response.json();
}

export async function getRightsPreset(id: string): Promise<RightsPresetResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/rights-presets/${id}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch rights preset');
  }

  return response.json();
}

export async function createRightsPreset(data: {
  name: string;
  description?: string;
  creator: string;
  copyrightNotice: string;
  usageRights: string;
  creditLine?: string;
  instructions?: string;
  city?: string;
  state?: string;
  country?: string;
  keywords?: string[];
  isDefault?: boolean;
}): Promise<RightsPresetResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/rights-presets`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create rights preset');
  }

  return response.json();
}

export async function updateRightsPreset(
  id: string,
  data: Partial<{
    name: string;
    description?: string;
    creator: string;
    copyrightNotice: string;
    usageRights: string;
    creditLine?: string;
    instructions?: string;
    city?: string;
    state?: string;
    country?: string;
    keywords?: string[];
    isDefault?: boolean;
  }>
): Promise<RightsPresetResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/rights-presets/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update rights preset');
  }

  return response.json();
}

export async function deleteRightsPreset(id: string): Promise<RightsPresetResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/rights-presets/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete rights preset');
  }

  return response.json();
}

export async function applyPresetToAsset(
  assetId: string,
  presetId: string,
  overwrite: boolean = false
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/admin/assets/${assetId}/apply-preset`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ presetId, overwrite }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to apply rights preset');
  }

  return response.json();
}

export async function batchApplyPreset(
  assetIds: string[],
  presetId: string,
  overwrite: boolean = false
): Promise<{ success: boolean; message: string; data: { success: number; failed: number; errors: any[] } }> {
  const response = await fetch(`${API_BASE_URL}/admin/assets/batch-apply-preset`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ assetIds, presetId, overwrite }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to batch apply rights preset');
  }

  return response.json();
}