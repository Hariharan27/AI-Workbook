import { useEffect, useState } from 'react';

import Loader from 'components/Loader';
import ErrorMessage from 'components/ErrorMessage';
import { GithubCorner, GithubStarButton } from 'components/Github';
import Filter from 'components/Filter';
import Products from 'components/Products';
import Cart from 'components/Cart';
import UserProfile from 'components/UserProfile';

import { useProducts } from 'contexts/products-context';

import * as S from './style';

function App() {
  const { isFetching, products, error, fetchProducts } = useProducts();
  const [currentPage, setCurrentPage] = useState<'shop' | 'profile'>('shop');

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const renderShopPage = () => (
    <>
      <S.TwoColumnGrid>
        <S.Side>
          <Filter />
          <GithubStarButton />
        </S.Side>
        <S.Main>
          <S.MainHeader>
            <p>{products?.length || 0} Product(s) found</p>
          </S.MainHeader>
          {error ? (
            <ErrorMessage
              title="Failed to Load Products"
              message={error}
              onRetry={fetchProducts}
            />
          ) : (
            <Products products={products} />
          )}
        </S.Main>
      </S.TwoColumnGrid>
      <Cart />
    </>
  );

  const renderProfilePage = () => (
    <UserProfile />
  );

  return (
    <S.Container>
      {isFetching && <Loader />}
      <GithubCorner />
      
      <S.Navigation>
        <S.NavButton 
          active={currentPage === 'shop'} 
          onClick={() => setCurrentPage('shop')}
        >
          🛒 Shopping Cart
        </S.NavButton>
        <S.NavButton 
          active={currentPage === 'profile'} 
          onClick={() => setCurrentPage('profile')}
        >
          🔓 User Profile (Vulnerable)
        </S.NavButton>
      </S.Navigation>

      {currentPage === 'shop' ? renderShopPage() : renderProfilePage()}
    </S.Container>
  );
}

export default App;
