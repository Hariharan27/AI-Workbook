import React, { useCallback, useMemo } from 'react';
import formatPrice from 'utils/formatPrice';
import { ICartProduct } from 'models';

import { useCart } from 'contexts/cart-context';

import * as S from './style';

interface IProps {
  product: ICartProduct;
}

const CartProduct = React.memo(({ product }: IProps) => {
  const { removeProduct, increaseProductQuantity, decreaseProductQuantity } =
    useCart();
  const {
    sku,
    title,
    price,
    style,
    currencyId,
    currencyFormat,
    availableSizes,
    quantity,
  } = product;

  // Memoize event handlers
  const handleRemoveProduct = useCallback(() => {
    removeProduct(product);
  }, [removeProduct, product]);

  const handleIncreaseProductQuantity = useCallback(() => {
    increaseProductQuantity(product);
  }, [increaseProductQuantity, product]);

  const handleDecreaseProductQuantity = useCallback(() => {
    decreaseProductQuantity(product);
  }, [decreaseProductQuantity, product]);

  // Memoize expensive calculations
  const formattedPrice = useMemo(() => {
    return formatPrice(price, currencyId);
  }, [price, currencyId]);

  const productDescription = useMemo(() => {
    return `${availableSizes[0]} | ${style}`;
  }, [availableSizes, style]);

  return (
    <S.Container>
      <S.DeleteButton
        onClick={handleRemoveProduct}
        title="remove product from cart"
      />
      <S.Image
        src={require(`static/products/${sku}-1-cart.webp`)}
        alt={title}
      />
      <S.Details>
        <S.Title>{title}</S.Title>
        <S.Desc>
          {productDescription} <br />
          Quantity: {quantity}
        </S.Desc>
      </S.Details>
      <S.Price>
        <p>{`${currencyFormat}  ${formattedPrice}`}</p>
        <div>
          <S.ChangeQuantity
            onClick={handleDecreaseProductQuantity}
            disabled={quantity === 1 ? true : false}
          >
            -
          </S.ChangeQuantity>
          <S.ChangeQuantity onClick={handleIncreaseProductQuantity}>
            +
          </S.ChangeQuantity>
        </div>
      </S.Price>
    </S.Container>
  );
});

CartProduct.displayName = 'CartProduct';

export default CartProduct;
