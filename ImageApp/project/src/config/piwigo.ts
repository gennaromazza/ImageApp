// Piwigo API configuration
export const PIWIGO_CONFIG = {
  baseUrl: 'https://gennaromazzacane.it/carnival2025/piwigo',
  apiEndpoint: '/ws.php',
  defaultCategory: 'booking-photos',
  thumbnailSize: 'medium',
  imageSize: '2small',
  perPage: 100,
  database: {
    host: 'localhost',
    name: 'chdpiyzx_booking',
    user: 'chdpiyzx_milena',
    password: '_1500Napoli500_',
    prefix: 'piwigo_'
  }
};

// Piwigo API methods
export const PIWIGO_METHODS = {
  login: 'pwg.session.login',
  upload: 'pwg.images.upload',
  delete: 'pwg.images.delete',
  getImages: 'pwg.categories.getImages',
  addCategory: 'pwg.categories.add',
  getCategories: 'pwg.categories.getList'
};

// Piwigo admin credentials
export const PIWIGO_ADMIN = {
  username: 'gennaro.mazzacane@gmail.com',
  password: '_1500Napoli500_'
};