// Format phone number for display
export const formatPhone = (phone: string): string => {
  // Remove any non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone;
};

// Get WhatsApp link
export const getWhatsAppLink = (phone: string) => {
  // Remove any non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  return `https://wa.me/39${cleanPhone}`; // Always add 39 for Italy
};

// Validate phone number format
export const validatePhoneNumber = (phone: string): boolean => {
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Basic validation rules for Italian phone numbers
  if (cleanPhone.length < 9 || cleanPhone.length > 10) {
    return false;
  }
  
  return true;
};