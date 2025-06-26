import axios, { AxiosError } from 'axios';
import { IGetProductsResponse, IProduct } from 'models';

const isProduction = process.env.NODE_ENV === 'production';

export const getProducts = async (): Promise<IProduct[]> => {
  try {
    let response: IGetProductsResponse;

    if (isProduction) {
      response = await axios.get(
        'https://react-shopping-cart-67954.firebaseio.com/products.json',
        { 
          timeout: 10000, // 10 second timeout
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    } else {
      response = require('static/json/products.json');
    }

    // Validate response structure
    if (!response || !response.data) {
      throw new Error('Invalid response format from server');
    }

    const { products } = response.data;
    
    // Validate products array
    if (!Array.isArray(products)) {
      throw new Error('Products data is not in the expected format');
    }

    // Validate each product has required fields
    const validProducts = products.filter((product: any) => {
      return product && 
             typeof product.id === 'number' &&
             typeof product.title === 'string' &&
             typeof product.price === 'number' &&
             Array.isArray(product.availableSizes);
    });

    if (validProducts.length === 0) {
      throw new Error('No valid products found in the response');
    }

    return validProducts;
  } catch (error) {
    console.error('Failed to fetch products:', error);
    
    // Handle specific error types
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      if (axiosError.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please check your connection and try again.');
      }
      
      if (axiosError.response?.status === 404) {
        throw new Error('Products not found. Please try again later.');
      }
      
      if (axiosError.response?.status && axiosError.response.status >= 500) {
        throw new Error('Server error. Please try again later.');
      }
      
      if (axiosError.response?.status && axiosError.response.status >= 400) {
        throw new Error('Bad request. Please try again.');
      }
      
      throw new Error('Network error. Please check your connection and try again.');
    }
    
    // Handle other errors
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    
    throw new Error('Failed to load products. Please try again later.');
  }
};
