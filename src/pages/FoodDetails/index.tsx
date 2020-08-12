import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      // Load a specific food with extras based on routeParams id
      const formattedFood = await api
        .get<Food>(`/foods/${routeParams.id}`)
        .then(response => {
          return {
            ...response.data,
            formattedPrice: formatValue(response.data.price),
          };
        });
      setFood(formattedFood);

      const formattedExtras = formattedFood.extras.map(extra => {
        return {
          ...extra,
          quantity: 0,
        };
      });
      setExtras(formattedExtras);

      const checkFavorite = await api.get<Food[] | []>('favorites');
      const favFound = checkFavorite.data.findIndex(
        favId => favId.id === routeParams.id,
      );

      if (favFound !== -1) {
        setIsFavorite(true);
      }
    }
    loadFood();
  }, [routeParams]);

  function handleIncrementExtra(id: number): void {
    // Increment extra quantity

    const extrasIncremented = extras.map(extra =>
      extra.id === id ? { ...extra, quantity: extra.quantity + 1 } : extra,
    );

    setExtras(extrasIncremented);
  }

  function handleDecrementExtra(id: number): void {
    // Decrement extra quantity
    const newExtra = extras.map(extra =>
      extra.id === id && extra.quantity > 0
        ? { ...extra, quantity: extra.quantity - 1 }
        : extra,
    );

    setExtras(newExtra);
  }

  function handleIncrementFood(): void {
    // Increment food quantity

    setFoodQuantity(foodQuantity + 1);
  }

  function handleDecrementFood(): void {
    // Decrement food quantity
    if (foodQuantity === 1) return;

    setFoodQuantity(foodQuantity - 1);
  }

  const toggleFavorite = useCallback(() => {
    // Toggle if food is favorite or not
    const favFood = food;
    delete favFood.extras;
    delete favFood.formattedPrice;

    if (!isFavorite) {
      api.post('favorites', favFood);
      setIsFavorite(true);
    } else {
      api.delete(`favorites/${favFood.id}`);
      setIsFavorite(false);
    }
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    const totalExtras = extras.reduce((accumulator, extra) => {
      const extrasSubtotal = extra.value * extra.quantity;

      return accumulator + extrasSubtotal;
    }, 0.0);

    const parsedTotalExtras = Number.parseFloat(`${totalExtras}`);
    const parsedFoodPrice = Number.parseFloat(`${food.price}`);

    const total = (parsedTotalExtras + parsedFoodPrice) * foodQuantity;

    return formatValue(total);
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    // Finish the order and save on the API
    const orderCompleted = food;

    delete orderCompleted.formattedPrice;

    await api.post('orders', orderCompleted);

    navigation.goBack();
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
