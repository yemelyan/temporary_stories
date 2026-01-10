import { config, fields, collection } from '@keystatic/core';

export default config({
  storage: {
    kind: 'local',
  },
  collections: {
    stories: collection({
      label: 'Stories',
      slugField: 'id',
      path: 'src/content/stories/*',
      format: { contentField: 'content' },
      schema: {
        id: fields.text({
          label: 'ID',
          description: 'Unique identifier for this story (e.g., "001", "002", "003")',
          validation: { length: { min: 1 } },
        }),
        title: fields.text({
          label: 'Title',
          validation: { length: { min: 1 } },
        }),
        summary: fields.text({
          label: 'Summary',
          description: 'Short description shown on the card (1-2 sentences)',
          multiline: true,
        }),
        date: fields.date({
          label: 'Publication Date',
        }),
        image: fields.image({
          label: 'Cover Image',
          directory: 'public/images/stories',
          publicPath: '/images/stories',
        }),
        content: fields.mdx({
          label: 'Main Content',
        }),
      },
    }),
  },
});