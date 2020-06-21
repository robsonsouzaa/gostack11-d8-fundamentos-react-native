import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      // AsyncStorage.clear();
      const storageProducts = await AsyncStorage.getItem(
        'GoMarketplace:products',
      );

      if (storageProducts) {
        setProducts([...JSON.parse(storageProducts)]);
      }
    }

    loadProducts();
  }, []);

  useEffect(() => {
    async function updateProducts(): Promise<void> {
      await AsyncStorage.setItem(
        'GoMarketplace:products',
        JSON.stringify([...products]),
      );
    }

    updateProducts();
  }, [products]);

  const addToCart = useCallback(
    async product => {
      const productExists = products.find(prod => prod.id === product.id);
      let productAdd: Product[];

      if (productExists) {
        productAdd = products.map(prod =>
          prod.id === product.id
            ? { ...product, quantity: prod.quantity + 1 }
            : prod,
        );
      } else {
        productAdd = [...products, { ...product, quantity: 1 }];
      }

      setProducts(productAdd);
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const newProducts = products.map(prod =>
        prod.id === id ? { ...prod, quantity: prod.quantity + 1 } : prod,
      );

      setProducts(newProducts);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productExists = products.find(prod => prod.id === id);

      if (productExists?.quantity === 0) {
        return;
      }

      setProducts(
        products.map(prod =>
          prod.id === id ? { ...prod, quantity: prod.quantity - 1 } : prod,
        ),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
