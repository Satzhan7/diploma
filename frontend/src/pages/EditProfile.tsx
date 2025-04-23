import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  VStack,
  Heading,
  Button,
  FormControl,
  FormLabel,
  Input,
  HStack,
  useToast,
  Avatar,
  Stack,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem,
  InputGroup,
  InputLeftAddon,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { useForm, SubmitHandler, useFieldArray, FieldArrayWithId } from 'react-hook-form';
import { User, UserRole } from '../types/user';
import { usersService } from '../services/users';

interface ProfileFormData {
  name: string;
  email: string;
  avatarUrl?: string;
  profileImage?: string;
  coverImage?: string;
  bio?: string;
  followers?: number;
  engagementRate?: number;
  categories?: { value: string }[];
  languages?: string[];
  location?: string;
  industry?: string;
  website?: string;
  social_instagram?: string;
  newCategory?: string;
}

export const EditProfile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { register, handleSubmit, control, setValue, watch, formState: { errors, isSubmitting } } = useForm<ProfileFormData>();
  
  const { fields: categoryFields, append: appendCategory, remove: removeCategory } = useFieldArray({
    control,
    name: "categories"
  });

  const newCategoryValue = watch("newCategory");

  useEffect(() => {
    if (user) {
      setValue('name', user.name);
      setValue('email', user.email);
      setValue('avatarUrl', user.avatarUrl || '');
      setValue('profileImage', user.profileImage || '');
      setValue('coverImage', user.coverImage || '');
      setValue('bio', user.bio || '');
      setValue('followers', user.followers || 0);
      setValue('engagementRate', user.engagementRate || 0);
      setValue('categories', user.categories?.map(cat => ({ value: cat })) || []);
      setValue('languages', user.languages || []);
      setValue('location', user.location || '');
      if (user.role === UserRole.BRAND) {
        setValue('industry', user.industry || '');
        setValue('website', user.profile?.websiteUrl || '');
      }
      const instagram = user.profile?.socialMedia.find(sm => sm.type === 'instagram');
      setValue('social_instagram', instagram?.url || '');
    }
  }, [user, setValue]);

  const onSubmit: SubmitHandler<ProfileFormData> = async (data: ProfileFormData) => {
    if (!user) return;

    try {
      const updateData: Partial<User> = {
        name: data.name,
        email: data.email,
        avatarUrl: data.avatarUrl,
        profileImage: data.profileImage,
        coverImage: data.coverImage,
        bio: data.bio,
        followers: data.followers,
        engagementRate: data.engagementRate,
        categories: data.categories?.map(cat => cat.value),
        languages: data.languages,
        location: data.location,
        industry: user.role === UserRole.BRAND ? data.industry : undefined,
      };

      await usersService.updateProfile(user.id, updateData);
      await refreshUser();
      navigate('/profile');
    } catch (error) {
      toast({
        title: 'Update failed.',
        description: 'Could not update profile.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleAddCategory = () => {
    if (newCategoryValue && !categoryFields.some((field: { value: string }) => field.value === newCategoryValue)) {
      appendCategory({ value: newCategoryValue });
      setValue("newCategory", "");
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Container maxW="container.md" py={{ base: 8, md: 12 }}>
      <VStack spacing={8} align="stretch">
        <Heading size="lg">Edit Profile</Heading>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={4}>
            <FormControl isInvalid={!!errors.name}>
              <FormLabel>Name</FormLabel>
              <Input {...register('name', { required: 'Name is required' })} />
            </FormControl>

            <FormControl isInvalid={!!errors.email}>
              <FormLabel>Email</FormLabel>
              <Input type="email" {...register('email', { required: 'Email is required' })} />
            </FormControl>

            <FormControl>
              <FormLabel>Avatar URL</FormLabel>
              <Input {...register('avatarUrl')} placeholder="https://..." />
            </FormControl>
            
            <FormControl>
              <FormLabel>Profile Image URL</FormLabel>
              <Input {...register('profileImage')} placeholder="https://..." />
            </FormControl>

            <FormControl>
              <FormLabel>Cover Image URL</FormLabel>
              <Input {...register('coverImage')} placeholder="https://..." />
            </FormControl>

            <FormControl>
              <FormLabel>Bio</FormLabel>
              <Input as="textarea" {...register('bio')} />
            </FormControl>

            {user?.role === UserRole.INFLUENCER && (
              <>
                <FormControl isInvalid={!!errors.followers}>
                  <FormLabel>Followers</FormLabel>
                  <Input type="number" {...register('followers', { valueAsNumber: true, min: 0 })} />
                </FormControl>

                <FormControl isInvalid={!!errors.engagementRate}>
                  <FormLabel>Engagement Rate (%)</FormLabel>
                  <Input type="number" step="0.01" {...register('engagementRate', { valueAsNumber: true, min: 0, max: 100 })} />
                </FormControl>
              </>
            )}

            <FormControl>
              <FormLabel>Categories/Niches</FormLabel>
              <HStack mb={2}>
                  <Input 
                      placeholder="Add a category" 
                      {...register("newCategory")} 
                  />
                  <Button onClick={handleAddCategory} size="sm">Add</Button>
              </HStack>
              <Wrap>
                {categoryFields.map((field: FieldArrayWithId<ProfileFormData, "categories", "id">, index: number) => (
                  <WrapItem key={field.id}>
                    <Tag size="lg" borderRadius="full" variant="solid" colorScheme="blue">
                      <Avatar name={field.value} size="xs" ml={-1} mr={2} />
                      <TagLabel>{field.value}</TagLabel>
                      <TagCloseButton onClick={() => removeCategory(index)} />
                    </Tag>
                  </WrapItem>
                ))}
              </Wrap>
            </FormControl>
            
            <FormControl>
                <FormLabel>Languages</FormLabel>
                <Input {...register('languages')} placeholder="English, Spanish..." />
            </FormControl>

             <FormControl>
                <FormLabel>Location</FormLabel>
                <Input {...register('location')} />
            </FormControl>
            
            {user?.role === UserRole.BRAND && (
               <>
                  <FormControl>
                      <FormLabel>Industry</FormLabel>
                      <Input {...register('industry')} />
                  </FormControl>
                  <FormControl>
                      <FormLabel>Website</FormLabel>
                      <Input {...register('website')} placeholder="https://..." />
                  </FormControl>
               </>
            )}
            
            <FormControl>
              <FormLabel>Instagram Profile URL</FormLabel>
              <InputGroup>
                  <InputLeftAddon>https://instagram.com/</InputLeftAddon>
                  <Input {...register('social_instagram')} placeholder="username" />
              </InputGroup>
            </FormControl>

            <Button type="submit" colorScheme="blue" isLoading={isSubmitting}>Save Changes</Button>
          </Stack>
        </form>
      </VStack>
    </Container>
  );
}; 