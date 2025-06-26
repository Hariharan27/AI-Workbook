import React, { useMemo, useCallback } from 'react';
import { KeyboardEvent } from 'react';

import formatPrice from 'utils/formatPrice';
import { IProduct } from 'models';

import { useCart } from 'contexts/cart-context';

import * as S from './style';

interface IProps {
  product: IProduct;
}

const Product = React.memo(({ product }: IProps) => {
  const { openCart, addProduct } = useCart();
  const {
    sku,
    title,
    price,
    installments,
    currencyId,
    currencyFormat,
    isFreeShipping,
  } = product;

  // Memoize expensive price calculations
  const { formattedPrice, productInstallment } = useMemo(() => {
    const formattedPrice = formatPrice(price, currencyId);
    let productInstallment = null;

    if (installments) {
      const installmentPrice = price / installments;
      productInstallment = (
        <S.Installment>
          <span>or {installments} x</span>
          <b>
            {currencyFormat}
            {formatPrice(installmentPrice, currencyId)}
          </b>
        </S.Installment>
      );
    }

    return { formattedPrice, productInstallment };
  }, [price, installments, currencyId, currencyFormat]);

  // Memoize event handlers
  const handleAddProduct = useCallback(() => {
    addProduct({ ...product, quantity: 1 });
    openCart();
  }, [addProduct, openCart, product]);

  const handleAddProductWhenEnter = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.code === 'Space') {
      addProduct({ ...product, quantity: 1 });
      openCart();
    }
  }, [addProduct, openCart, product]);

  return (
    <S.Container onKeyUp={handleAddProductWhenEnter} sku={sku} tabIndex={1}>
      {isFreeShipping && <S.Stopper>Free shipping</S.Stopper>}
      <S.Image alt={title} />
      <S.Title>{title}</S.Title>
      <S.Price>
        <S.Val>
          <small>{currencyFormat}</small>
          <b>{formattedPrice.substring(0, formattedPrice.length - 3)}</b>
          <span>{formattedPrice.substring(formattedPrice.length - 3)}</span>
        </S.Val>
        {productInstallment}
      </S.Price>
      <S.BuyButton onClick={handleAddProduct} tabIndex={-1}>
        Add to cart
      </S.BuyButton>
    </S.Container>
  );
});

Product.displayName = 'Product';

export default Product;
