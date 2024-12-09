export interface Theme {
    id: string
    topics: string[]
}

export const themes: { [key: string]: Theme } = { "000": { "id": "000", "topics": ["Family Gatherings", "Holiday Celebrations", "Travel Adventures"] }, "001": { "id": "001", "topics": ["Exercise and Fitness", "Nutrition and Cooking", "Mental Well-being"] }, "002": { "id": "002", "topics": ["Gardening", "Art and Crafting", "Reading and Literature"] }, "003": { "id": "003", "topics": ["Volunteering", "Social Clubs", "Cultural Events"] }, "004": { "id": "004", "topics": ["Learning New Skills", "Staying Connected", "Smart Home Technology"] }, "005": { "id": "005", "topics": ["Road Trips", "Cultural Expeditions", "Nature Retreats"] }, "006": { "id": "006", "topics": ["Family History", "Personal Projects", "Cultural Traditions"] }, "007": { "id": "007", "topics": ["Financial Literacy", "Home Maintenance", "Cooking for One"] }, "008": { "id": "008", "topics": ["Birthdays", "Anniversaries", "Retirement Parties"] }, "009": { "id": "009", "topics": ["Theater and Performance", "Music and Dance", "Art Exhibitions"] } }
