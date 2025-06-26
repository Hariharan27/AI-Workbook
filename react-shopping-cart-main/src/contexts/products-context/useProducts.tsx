import { useCallback, useRef } from 'react';

import { useProductsContext } from './ProductsContextProvider';
import { IProduct } from 'models';
import { getProducts } from 'services/products';

const useProducts = () => {
  const {
    isFetching,
    setIsFetching,
    products,
    setProducts,
    filters,
    setFilters,
    error,
    setError,
  } = useProductsContext();

  // Use ref to track the latest request to prevent race conditions
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchProducts = useCallback(async () => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    
    setIsFetching(true);
    setError(null); // Clear any previous errors
    
    try {
      const products: IProduct[] = await getProducts();
      // Only update state if this request hasn't been cancelled
      if (!abortControllerRef.current.signal.aborted) {
        setProducts(products);
        setError(null);
      }
    } catch (error) {
      // Only handle errors if the request wasn't cancelled
      if (!abortControllerRef.current.signal.aborted) {
        console.error('Failed to fetch products:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load products';
        setError(errorMessage);
        setProducts([]); // Set empty array to prevent undefined state
      }
    } finally {
      // Only update loading state if this request hasn't been cancelled
      if (!abortControllerRef.current.signal.aborted) {
        setIsFetching(false);
      }
    }
  }, [setIsFetching, setProducts, setError]);

  const filterProducts = useCallback(async (newFilters: string[]) => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    setIsFetching(true);
    setError(null); // Clear any previous errors

    try {
      const allProducts: IProduct[] = await getProducts();
      
      // Only process if this request hasn't been cancelled
      if (!abortControllerRef.current.signal.aborted) {
        let filteredProducts: IProduct[];

        if (newFilters && newFilters.length > 0) {
          filteredProducts = allProducts.filter((p: IProduct) =>
            newFilters.some((filter: string) =>
              p.availableSizes.includes(filter)
            )
          );
        } else {
          filteredProducts = allProducts;
        }

        setFilters(newFilters);
        setProducts(filteredProducts);
        setError(null);
      }
    } catch (error) {
      // Only handle errors if the request wasn't cancelled
      if (!abortControllerRef.current.signal.aborted) {
        console.error('Failed to filter products:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to filter products';
        setError(errorMessage);
        setProducts([]);
      }
    } finally {
      // Only update loading state if this request hasn't been cancelled
      if (!abortControllerRef.current.signal.aborted) {
        setIsFetching(false);
      }
    }
  }, [setIsFetching, setProducts, setFilters, setError]);

  return {
    isFetching,
    fetchProducts,
    products,
    filterProducts,
    filters,
    error,
  };
};

export default useProducts;
