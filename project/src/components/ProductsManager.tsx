import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Image, DollarSign, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Product } from '../lib/settings';
import { useSettings } from '../hooks/useSettings';
import { updateEventSettings } from '../lib/settings';

interface ProductFormData {
  id?: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  enabled: boolean;
}

const ProductsManager: React.FC = () => {
  const { settings, loading } = useSettings();
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: 0,
    imageUrl: '',
    enabled: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      let updatedProducts = [...settings.products];

      if (editingProduct) {
        // Update existing product
        const index = updatedProducts.findIndex(p => p.id === editingProduct);
        if (index !== -1) {
          updatedProducts[index] = { ...formData, id: editingProduct };
        }
      } else {
        // Add new product
        const newProduct = {
          ...formData,
          id: crypto.randomUUID()
        };
        updatedProducts.push(newProduct);
      }

      await updateEventSettings({ products: updatedProducts });
      
      setShowAddForm(false);
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: 0,
        imageUrl: '',
        enabled: true
      });
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Errore durante il salvataggio del prodotto');
    }
  };

  const handleDelete = async (productId: string) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo prodotto?')) return;
    if (!settings) return;

    try {
      const updatedProducts = settings.products.filter(p => p.id !== productId);
      await updateEventSettings({ products: updatedProducts });
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Errore durante l\'eliminazione del prodotto');
    }
  };

  const startEditing = (product: Product) => {
    setFormData(product);
    setEditingProduct(product.id);
    setShowAddForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white flex items-center gap-2">
          <div className="animate-spin">⌛</div>
          Caricamento...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Gestione Prodotti</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[--theater-gold] text-black rounded-lg hover:bg-yellow-500"
        >
          <Plus size={20} />
          Nuovo Prodotto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settings?.products.map(product => (
          <motion.div
            key={product.id}
            layout
            className="bg-gray-800 rounded-lg overflow-hidden shadow-lg"
          >
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-4">
              <h3 className="text-xl font-semibold text-white mb-2">{product.name}</h3>
              <p className="text-gray-400 mb-4">{product.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-[--theater-gold] text-xl">€{product.price.toFixed(2)}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEditing(product)}
                    className="p-2 text-blue-400 hover:text-blue-300"
                  >
                    <Edit2 size={20} />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-2 text-red-400 hover:text-red-300"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {(showAddForm || editingProduct) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-gray-800 rounded-lg p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-white">
                  {editingProduct ? 'Modifica Prodotto' : 'Nuovo Prodotto'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingProduct(null);
                    setFormData({
                      name: '',
                      description: '',
                      price: 0,
                      imageUrl: '',
                      enabled: true
                    });
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2">Nome Prodotto</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Descrizione</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Prezzo</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      className="w-full pl-10 p-2 bg-gray-700 border border-gray-600 rounded text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">URL Immagine</label>
                  <div className="relative">
                    <Image className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                      className="w-full pl-10 p-2 bg-gray-700 border border-gray-600 rounded text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={e => setFormData({ ...formData, enabled: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label className="text-gray-300">Prodotto attivo</label>
                </div>

                <div className="flex justify-end gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingProduct(null);
                      setFormData({
                        name: '',
                        description: '',
                        price: 0,
                        imageUrl: '',
                        enabled: true
                      });
                    }}
                    className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 bg-[--theater-gold] text-black rounded hover:bg-yellow-500"
                  >
                    <Save size={20} />
                    {editingProduct ? 'Salva Modifiche' : 'Crea Prodotto'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductsManager;