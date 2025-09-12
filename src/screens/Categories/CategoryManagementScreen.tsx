// Category Management Screen Component
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  TextInput,
  IconButton,
  Portal,
  Dialog,
  FAB,
  Surface,
} from 'react-native-paper';
import { DatabaseService } from '../../services/database';
import { useAuth } from '../../hooks/useAuth';

interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  documentCount: number;
  createdAt: string;
}

export const CategoryManagementScreen: React.FC = () => {
  const { user } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Dialog states
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form states
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    color: '#2196F3',
    icon: 'folder',
  });

  useEffect(() => {
    if (user) {
      loadCategories();
    }
  }, [user]);

  const loadCategories = async () => {
    if (!user) return;

    try {
      const categoriesData = await DatabaseService.getCategories(user.id);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load categories:', error);
      Alert.alert('Error', 'Failed to load categories. Please try again.');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCategories();
    setRefreshing(false);
  };

  const handleCreateCategory = async () => {
    if (!user || !categoryForm.name.trim()) return;

    try {
      const newCategory = await DatabaseService.createCategory({
        userId: user.id,
        name: categoryForm.name.trim(),
        description: categoryForm.description.trim(),
        color: categoryForm.color,
        icon: categoryForm.icon,
      });

      setCategories([...categories, { ...newCategory, documentCount: 0 }]);
      setShowCategoryDialog(false);
      resetCategoryForm();
    } catch (error) {
      console.error('Failed to create category:', error);
      Alert.alert('Error', 'Failed to create category. Please try again.');
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    Alert.alert(
      'Delete Category',
      'Are you sure you want to delete this category?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!user) return;
              await DatabaseService.deleteCategory(categoryId, user.id);
              setCategories(categories.filter((cat) => cat.id !== categoryId));
            } catch (error) {
              console.error('Failed to delete category:', error);
              Alert.alert(
                'Error',
                'Failed to delete category. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      description: '',
      color: '#2196F3',
      icon: 'folder',
    });
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      color: category.color,
      icon: category.icon || 'folder',
    });
    setShowCategoryDialog(true);
  };

  const renderCategoryCard = (category: Category) => (
    <Card key={category.id} style={styles.categoryCard}>
      <Card.Content>
        <View style={styles.categoryHeader}>
          <View style={styles.categoryInfo}>
            <View
              style={[
                styles.colorIndicator,
                { backgroundColor: category.color },
              ]}
            />
            <View style={styles.categoryText}>
              <Text variant="titleMedium">{category.name}</Text>
              {category.description && (
                <Text variant="bodySmall" style={styles.description}>
                  {category.description}
                </Text>
              )}
              <Text variant="bodySmall" style={styles.documentCount}>
                {category.documentCount} documents
              </Text>
            </View>
          </View>
          <View style={styles.categoryActions}>
            <IconButton
              icon="pencil"
              size={20}
              onPress={() => handleEditCategory(category)}
            />
            <IconButton
              icon="delete"
              size={20}
              onPress={() => handleDeleteCategory(category.id)}
            />
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <Text variant="headlineSmall" style={styles.title}>
          Category Management
        </Text>

        {categories.length === 0 ? (
          <Surface style={styles.emptyState}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No categories yet. Create your first category to organize your
              documents.
            </Text>
          </Surface>
        ) : (
          categories.map(renderCategoryCard)
        )}
      </ScrollView>

      {/* Category Dialog */}
      <Portal>
        <Dialog
          visible={showCategoryDialog}
          onDismiss={() => {
            setShowCategoryDialog(false);
            setEditingCategory(null);
            resetCategoryForm();
          }}
        >
          <Dialog.Title>
            {editingCategory ? 'Edit Category' : 'Create Category'}
          </Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Category Name"
              value={categoryForm.name}
              onChangeText={(text) =>
                setCategoryForm({ ...categoryForm, name: text })
              }
              style={styles.input}
            />

            <TextInput
              label="Description (Optional)"
              value={categoryForm.description}
              onChangeText={(text) =>
                setCategoryForm({ ...categoryForm, description: text })
              }
              style={styles.input}
              multiline
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setShowCategoryDialog(false);
                setEditingCategory(null);
                resetCategoryForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onPress={handleCreateCategory}
              disabled={!categoryForm.name.trim()}
            >
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setShowCategoryDialog(true)}
        label="Category"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  categoryCard: {
    marginBottom: 16,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  categoryInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  colorIndicator: {
    width: 4,
    height: 60,
    borderRadius: 2,
    marginRight: 12,
  },
  categoryText: {
    flex: 1,
  },
  description: {
    marginTop: 4,
    opacity: 0.7,
  },
  documentCount: {
    marginTop: 4,
    opacity: 0.6,
  },
  categoryActions: {
    flexDirection: 'row',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    borderRadius: 8,
    elevation: 1,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.6,
  },
  input: {
    marginBottom: 16,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});

export default CategoryManagementScreen;
