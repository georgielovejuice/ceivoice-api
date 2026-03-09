import prisma from "../lib/prisma";

export const getOrCreateCategory = async (categoryName: string) => {
  let category = await prisma.category.findUnique({
    where: { name: categoryName }
  });

  if (!category) {
    category = await prisma.category.create({
      data: { name: categoryName }
    });
  }

  return category;
};

export const getAllCategories = async () => {
  return await prisma.category.findMany();
};

export const getAllActiveCategories = async () => {
  return await prisma.category.findMany({
    where: { is_active: true },
    select: { name: true, category_id: true }
  });
};
