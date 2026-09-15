import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'product',
  title: 'Товар',
  type: 'document',
  fields: [
    defineField({name: 'name', title: 'Наименование', type: 'string', validation: rule => rule.required()}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'name', maxLength: 96}}),
    defineField({name: 'category', title: 'Категория', type: 'string'}),
    defineField({name: 'price', title: 'Цена продажи устройства', type: 'number'}),
    defineField({name: 'shortDescription', title: 'Краткое описание', type: 'text', rows: 3}),
    defineField({name: 'description', title: 'Описание', type: 'text', rows: 8}),
    defineField({name: 'imageUrl', title: 'Ссылка на картинку', type: 'url'}),
    defineField({name: 'imageUrl1', title: 'Ссылка на картинку 1', type: 'url'}),
    defineField({name: 'imageUrl2', title: 'Ссылка на картинку 2', type: 'url'}),
    defineField({name: 'city', title: 'Город', type: 'string', initialValue: 'Все города'}),
    defineField({name: 'status', title: 'Статус наличия', type: 'string'}),
    defineField({name: 'promo', title: 'Акция', type: 'string'}),
    defineField({name: 'tag', title: 'Метка', type: 'string'}),
    defineField({name: 'specifications', title: 'Технические параметры', type: 'text', rows: 8}),
  ],
  preview: {
    select: {title: 'name', subtitle: 'category', media: 'imageUrl'},
  },
})
