import React, { useMemo, useCallback } from 'react';
import { useProducts } from 'contexts/products-context';

import * as S from './style';

export const availableSizes = ['XS', 'S', 'M', 'ML', 'L', 'XL', 'XXL'];

const Filter = React.memo(() => {
  const { filters, filterProducts } = useProducts();

  const toggleCheckbox = useCallback((label: string) => {
    const selectedCheckboxes = new Set(filters);
    
    if (selectedCheckboxes.has(label)) {
      selectedCheckboxes.delete(label);
    } else {
      selectedCheckboxes.add(label);
    }

    const newFilters = Array.from(selectedCheckboxes);
    filterProducts(newFilters);
  }, [filters, filterProducts]);

  // Memoize checkbox creation
  const checkboxes = useMemo(() => {
    return availableSizes.map((label: string) => (
      <S.Checkbox 
        label={label} 
        handleOnChange={toggleCheckbox} 
        key={label} 
      />
    ));
  }, [toggleCheckbox]);

  return (
    <S.Container>
      <S.Title>Sizes:</S.Title>
      {checkboxes}
    </S.Container>
  );
});

Filter.displayName = 'Filter';

export default Filter;
