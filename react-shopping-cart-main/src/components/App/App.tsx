import { useEffect } from 'react';

import Loader from 'components/Loader';
import ErrorMessage from 'components/ErrorMessage';
import { GithubCorner, GithubStarButton } from 'components/Github';
import Recruiter from 'components/Recruiter';
import Filter from 'components/Filter';
import Products from 'components/Products';
import Cart from 'components/Cart';

import { useProducts } from 'contexts/products-context';

import * as S from './style';

function App() {
  const { isFetching, products, error, fetchProducts } = useProducts();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <S.Container>
      {isFetching && <Loader />}
      <GithubCorner />
      <Recruiter />
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
    </S.Container>
  );
}

export default App;
