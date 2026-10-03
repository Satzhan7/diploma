import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Textarea,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useToast,
  Card,
  CardBody,
} from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

interface OrderFormData {
  title: string;
  description: string;
  budget: number;
  category: string;
  requirements: string;
  deadline: string;
}

// Order edit/delete is intentionally not exposed in the demo build because
// the backend does not implement PATCH/DELETE /orders/:id. This page only
// covers order creation; re-introduce edit support once those endpoints exist.
export const CreateOrder: React.FC = () => {
  const { t } = useTranslation('brand');
  const navigate = useNavigate();
  const toast = useToast();
  const [formData, setFormData] = useState<OrderFormData>({
    title: '',
    description: '',
    budget: 1000,
    category: '',
    requirements: '',
    deadline: '',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'budget' ? Number(value) : value,
    }));
  };

  const handleNumberInputChange = (_: string, valueAsNumber: number) => {
    setFormData((prev) => ({ ...prev, budget: valueAsNumber }));
  };

  const createOrderMutation = useMutation({
    mutationFn: (data: OrderFormData) => api.post('/orders', data),
    onSuccess: () => {
      toast({
        title: t('createOrder.toasts.successTitle'),
        description: t('createOrder.toasts.successDescription'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/brand/orders');
    },
    onError: (error: any) => {
      toast({
        title: t('common:state.error'),
        description: error.response?.data?.message || t('createOrder.toasts.errorFallback'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createOrderMutation.mutate(formData);
  };

  return (
    <Box p={8}>
      <VStack spacing={8} align="stretch">
        <Heading size="lg">{t('createOrder.title')}</Heading>

        <Card>
          <CardBody>
            <form onSubmit={handleSubmit}>
              <VStack spacing={6}>
                <FormControl isRequired>
                  <FormLabel>{t('createOrder.fields.title')}</FormLabel>
                  <Input
                    name="title"
                    placeholder={t('createOrder.fields.titlePlaceholder')}
                    value={formData.title}
                    onChange={handleInputChange}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>{t('createOrder.fields.description')}</FormLabel>
                  <Textarea
                    name="description"
                    placeholder={t('createOrder.fields.descriptionPlaceholder')}
                    rows={4}
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>{t('createOrder.fields.budget')}</FormLabel>
                  <NumberInput
                    min={0}
                    value={formData.budget}
                    onChange={handleNumberInputChange}
                  >
                    <NumberInputField name="budget" />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>{t('createOrder.fields.category')}</FormLabel>
                  <Select
                    name="category"
                    placeholder={t('createOrder.fields.categoryPlaceholder')}
                    value={formData.category}
                    onChange={handleInputChange}
                  >
                    <option value="fashion">{t('categories.fashion')}</option>
                    <option value="beauty">{t('categories.beauty')}</option>
                    <option value="technology">{t('categories.technology')}</option>
                    <option value="food">{t('categories.food')}</option>
                    <option value="lifestyle">{t('categories.lifestyle')}</option>
                    <option value="travel">{t('categories.travel')}</option>
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>{t('createOrder.fields.requirements')}</FormLabel>
                  <Textarea
                    name="requirements"
                    placeholder={t('createOrder.fields.requirementsPlaceholder')}
                    rows={4}
                    value={formData.requirements}
                    onChange={handleInputChange}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>{t('createOrder.fields.deadline')}</FormLabel>
                  <Input
                    name="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={handleInputChange}
                  />
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="brand"
                  size="lg"
                  width="full"
                  isLoading={createOrderMutation.isPending}
                >
                  {t('createOrder.submit')}
                </Button>
              </VStack>
            </form>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};
