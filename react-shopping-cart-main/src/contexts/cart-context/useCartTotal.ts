import { useMemo } from 'react';
import { useCartContext } from './CartContextProvider';
import { ICartProduct } from 'models';

const useCartTotal = () => {
  const { total, setTotal, products } = useCartContext();

  // Memoize cart calculations
  const calculatedTotal = useMemo(() => {
    if (!Array.isArray(products)) {
      return total;
    }

    const validProducts = products.filter(
      (product: ICartProduct) => 
        product && 
        typeof product.quantity === 'number' && 
        product.quantity > 0 &&
        typeof product.price === 'number' && 
        product.price >= 0
    );

    const productQuantity = validProducts.reduce(
      (sum: number, product: ICartProduct) => sum + product.quantity, 0
    );

    const totalPrice = validProducts.reduce(
      (sum: number, product: ICartProduct) => sum + (product.price * product.quantity), 0
    );

    const installments = validProducts.reduce(
      (greater: number, product: ICartProduct) => Math.max(greater, product.installments || 0), 0
    );

    return {
      productQuantity,
      installments,
      totalPrice: Math.round(totalPrice * 100) / 100,
      currencyId: 'USD',
      currencyFormat: '$',
    };
  }, [products, total]);

  const updateCartTotal = (products: ICartProduct[]) => {
    // Validate input
    if (!Array.isArray(products)) {
      console.warn('Invalid products array provided to updateCartTotal');
      return;
    }

    // Filter out invalid products
    const validProducts = products.filter(
      (product: ICartProduct) => 
        product && 
        typeof product.quantity === 'number' && 
        product.quantity > 0 &&
        typeof product.price === 'number' && 
        product.price >= 0
    );

    const productQuantity = validProducts.reduce(
      (sum: number, product: ICartProduct) => {
        return sum + product.quantity;
      },
      0
    );

    const totalPrice = validProducts.reduce((sum: number, product: ICartProduct) => {
      return sum + (product.price * product.quantity);
    }, 0);

    const installments = validProducts.reduce(
      (greater: number, product: ICartProduct) => {
        return Math.max(greater, product.installments || 0);
      },
      0
    );

    const newTotal = {
      productQuantity,
      installments,
      totalPrice: Math.round(totalPrice * 100) / 100, // Round to 2 decimal places
      currencyId: 'USD',
      currencyFormat: '$',
    };

    setTotal(newTotal);
  };

  return {
    total: calculatedTotal,
    updateCartTotal,
  };
};

export default useCartTotal;
