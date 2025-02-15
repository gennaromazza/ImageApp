// src/lib/piwigo.ts
import { PIWIGO_CONFIG, PIWIGO_METHODS, PIWIGO_ADMIN } from '../config/piwigo';

export interface PiwigoImage {
  id: number;
  width: number;
  height: number;
  hit: number;
  file: string;
  name: string;
  comment: string;
  date_creation: string;
  date_available: string;
  page_url: string;
  element_url: string;
  derivatives: {
    [key: string]: {
      url: string;
      width: number;
      height: number;
    };
  };
}

interface PiwigoCategory {
  id: number;
  name: string;
  comment?: string;
  url?: string;
  permalink?: string;
  nb_images?: number;
  total_nb_images?: number;
  representative_picture_id?: number;
  date_last?: string;
  max_date_last?: string;
  nb_categories?: number;
  url_self?: string;
  full_name?: string;
  global_rank?: string;
}

class PiwigoClient {
  private token: string | null = null;
  private baseUrl: string;
  private defaultCategoryId: number | null = null;

  constructor() {
    this.baseUrl = PIWIGO_CONFIG.baseUrl;
  }

  async initialize() {
    if (!this.token) {
      try {
        await this.login(PIWIGO_ADMIN.username, PIWIGO_ADMIN.password);
        await this.initializeDefaultCategory();
        console.log('Piwigo authentication completed');
      } catch (error) {
        console.error('Piwigo authentication error:', error);
        throw error;
      }
    }
  }

  private async initializeDefaultCategory() {
    try {
      const categories = await this.request(PIWIGO_METHODS.getCategories) as PiwigoCategory[];
      let defaultCategory = categories.find(cat => cat.name === PIWIGO_CONFIG.defaultCategory);
      
      if (!defaultCategory) {
        // Create default category if it doesn't exist
        const result = await this.request(PIWIGO_METHODS.addCategory, {
          name: PIWIGO_CONFIG.defaultCategory,
          comment: 'Default category for booking photos'
        });
        this.defaultCategoryId = result.id;
      } else {
        this.defaultCategoryId = defaultCategory.id;
      }
    } catch (error) {
      console.error('Error initializing default category:', error);
      throw error;
    }
  }

  private async request(method: string, params: any = {}) {
    const url = `${this.baseUrl}${PIWIGO_CONFIG.apiEndpoint}?format=json`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...(this.token && { 'X-Session-ID': this.token })
      },
      body: new URLSearchParams({
        method,
        ...params
      })
    });

    if (!response.ok) {
      throw new Error(`Piwigo API error: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.stat !== 'ok') {
      throw new Error(data.message || 'Piwigo API error');
    }

    return data.result;
  }

  async login(username: string, password: string) {
    const result = await this.request(PIWIGO_METHODS.login, {
      username,
      password
    });
    this.token = result.pwg_id;
    return result;
  }

  async uploadImage(file: File, bookingId: string, onProgress?: (progress: number) => void): Promise<PiwigoImage> {
    if (!this.token) {
      await this.initialize();
    }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('category', await this.getOrCreateBookingCategory(bookingId));
    formData.append('name', `${bookingId}_${file.name}`);
    formData.append('comment', `Booking: ${bookingId}`);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${this.baseUrl}${PIWIGO_CONFIG.apiEndpoint}?format=json&method=${PIWIGO_METHODS.upload}`);
    xhr.setRequestHeader('X-Session-ID', this.token!);

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress((event.loaded / event.total) * 100);
        }
      };
    }

    return new Promise((resolve, reject) => {
      xhr.onload = async () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.stat === 'ok') {
              resolve(response.result as PiwigoImage);
            } else {
              reject(new Error(response.message || 'Upload failed'));
            }
          } catch (error) {
            reject(new Error('Invalid response'));
          }
        } else {
          reject(new Error('Upload failed'));
        }
      };

      xhr.onerror = () => reject(new Error('Network error'));
      xhr.send(formData);
    });
  }

  async getBookingImages(bookingId: string): Promise<PiwigoImage[]> {
    if (!this.token) {
      await this.initialize();
    }

    const categoryId = await this.getOrCreateBookingCategory(bookingId);
    const result = await this.request(PIWIGO_METHODS.getImages, {
      cat_id: categoryId,
      per_page: PIWIGO_CONFIG.perPage,
      order: 'date_creation DESC'
    });
    return result.images || [];
  }

  async deleteImage(imageId: number): Promise<void> {
    if (!this.token) {
      await this.initialize();
    }

    await this.request(PIWIGO_METHODS.delete, {
      image_id: imageId
    });
  }

  private async getOrCreateBookingCategory(bookingId: string): Promise<number> {
    if (!this.defaultCategoryId) {
      await this.initializeDefaultCategory();
    }

    const categories = await this.request(PIWIGO_METHODS.getCategories) as PiwigoCategory[];
    const bookingCategory = categories.find(cat => cat.name === `booking-${bookingId}`);
    
    if (bookingCategory) {
      return bookingCategory.id;
    }

    // Create new category for booking
    const result = await this.request(PIWIGO_METHODS.addCategory, {
      name: `booking-${bookingId}`,
      parent: this.defaultCategoryId,
      comment: `Photos for booking ${bookingId}`
    });

    return result.id;
  }
}

export const piwigoClient = new PiwigoClient();
