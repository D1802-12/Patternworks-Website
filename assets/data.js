/*
  Patternworks website content.
  Edit this file to change the contact email, the pattern books, their house types
  and the target figures on the homepage. Save, commit and push: Vercel redeploys.

  Text tips: use ’ for apostrophes in copy (for example "we’re"), and keep each
  value inside its quotes.
*/
window.PATTERNWORKS = {

  /* Where enquiries from the contact form are sent. Replace before going live. */
  contactEmail: 'hello@patternworks.example',

  /*
    Pattern books, in the order they appear.

    slug       the page address, e.g. yoursite.com/#be-first-small-sites (lowercase, hyphens)
    owner      shown on the book page; use null to show "To confirm"
    status     the label on the card; statusKey 'in' (teal) or 'soon' (grey)
    tint       cover colour: 'a' teal, 'b' slate, 'c' moss
    cover      cover drawing: 'terrace', 'gables' or 'semis'
    types      the house types (leave [] to show "House types being added")

    Each house type:
    id, name   e.g. 'type-a', 'Type A'
    beds, people, storeys
    gia        floor area as text, e.g. '78 m²', or null to show "To confirm"
    desc       one sentence
    draw       the illustrative elevation, until the 3D model exists:
               w (width, 50 to 90), roof ('eaves', 'gable' or 'hip'),
               door ('l', 'c' or 'r'), slots (optional: window bays)
  */
  books: [
    {
      slug: 'be-first-small-sites',
      name: 'Be First Small Sites Patternbook',
      owner: 'Be First, the regeneration company for Barking and Dagenham',
      region: 'London',
      nation: 'England',
      status: 'In the catalogue',
      statusKey: 'in',
      tint: 'a',
      cover: 'terrace',
      summary: 'House types designed for small and infill sites in London, from Be First, the regeneration company for Barking and Dagenham.',
      /* Check these four against the book before going live */
      types: [
        { id: 'type-a', name: 'Type A', beds: 2, people: 4, storeys: 2, gia: '78 m²', desc: 'Two-bedroom, four-person house over two storeys.', draw: { w: 60, roof: 'eaves', door: 'l' } },
        { id: 'type-c', name: 'Type C', beds: 2, people: 4, storeys: 2, gia: null, desc: 'Two-bedroom, four-person house with a front stair.', draw: { w: 60, roof: 'gable', door: 'r' } },
        { id: 'type-d', name: 'Type D', beds: 2, people: 4, storeys: 2, gia: null, desc: 'Two-bedroom, four-person house with the stair against the party wall.', draw: { w: 60, roof: 'eaves', door: 'r' } },
        { id: 'type-e', name: 'Type E', beds: 4, people: 6, storeys: 2, gia: null, desc: 'Four-bedroom, six-person house over two storeys.', draw: { w: 88, roof: 'hip', door: 'c', slots: 3 } }
      ]
    },
    {
      slug: 'edinburgh-home-demonstrator',
      name: 'Edinburgh Home Demonstrator',
      owner: null,
      region: 'Edinburgh and South East Scotland',
      nation: 'Scotland',
      status: 'Being added',
      statusKey: 'soon',
      tint: 'b',
      cover: 'gables',
      summary: 'Standardised, offsite-built affordable homes developed through the Edinburgh Home Demonstrator programme in South East Scotland.',
      types: []
    },
    {
      slug: 'tai-ar-y-cyd',
      name: 'Tai ar y Cyd',
      owner: 'A consortium of 23 social landlords in Wales, with Welsh Government funding',
      region: 'Wales',
      nation: 'Wales',
      status: 'Being added',
      statusKey: 'soon',
      tint: 'c',
      cover: 'semis',
      summary: 'A shared pattern book of house types for social landlords across Wales, developed by a consortium of 23 landlords with Welsh Government funding.',
      types: []
    }
  ],

  /*
    The "Today, and with Patternworks" bars on the homepage.
    today and pw are [low, high]; use the same number twice for a single value.
    max sets the length of a full bar. unit: 'weeks', 'tCO₂e' or '%'.
    These are business case targets and are labelled as such on the page.
  */
  metrics: [
    { name: 'Specification time',       max: 10, today: [8, 10],  pw: [4, 5],   unit: 'weeks' },
    { name: 'Supply chain lead time',   max: 16, today: [12, 16], pw: [8, 10],  unit: 'weeks' },
    { name: 'Embodied carbon per home', max: 45, today: [45, 45], pw: [32, 35], unit: 'tCO₂e' },
    { name: 'Delivery delays',          max: 20, today: [15, 20], pw: [5, 8],   unit: '%' }
  ]
};
