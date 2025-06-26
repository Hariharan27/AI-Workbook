import { IProduct } from 'models';
import Product from './Product';

import * as S from './style';

interface IProps {
  products: IProduct[];
}

const Products = ({ products }: IProps) => {
  if (!products || products.length === 0) {
    return (
      <S.Container>
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          margin: '20px 0'
        }}>
          <h3 style={{ 
            color: '#6c757d', 
            marginBottom: '10px',
            fontSize: '18px'
          }}>
            No Products Found
          </h3>
          <p style={{ 
            color: '#6c757d',
            fontSize: '14px',
            margin: 0
          }}>
            Try adjusting your filters or check back later.
          </p>
        </div>
      </S.Container>
    );
  }

  return (
    <S.Container>
      {products.map((p) => (
        <Product product={p} key={p.sku} />
      ))}
    </S.Container>
  );
};

export default Products;
