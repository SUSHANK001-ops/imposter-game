export interface WordCategorySeed {
  category: string;
  words: string[];
}

export const SEED_DATA: WordCategorySeed[] = [
  {
    category: "Animals",
    words: [
      "Elephant", "Giraffe", "Cheetah", "Kangaroo", "Penguin", "Dolphin", "Panda", "Octopus",
      "Chimpanzee", "Flamingo", "Hippopotamus", "Rhinoceros", "Koala", "Sloth", "Crocodile", "Peacock",
      "Chameleon", "Gorilla", "Hedgehog", "Jellyfish", "Lemur", "Meerkat", "Narwhal", "Otter",
      "Platypus", "Porcupine", "Quokka", "Raccoon", "Salamander", "Tarantula", "Urchin", "Vulture",
      "Walrus", "X-ray Tetra", "Yak", "Zebra", "Albatross", "Beaver", "Capybara", "Dingo",
      "Echidna", "Falcon", "Gazelle", "Hyena", "Iguana", "Jaguar", "Komodo Dragon", "Llama",
      "Manatee", "Nudibranch", "Ocelot", "Pangolin", "Quail", "Reindeer", "Seahorse", "Toucan",
      "Uakari", "Viper", "Wombat", "Axolotl", "Yeti Crab", "Zebu", "Armadillo", "Bison",
      "Cobra", "Dragonfly", "Eagle", "Fox", "Gecko", "Hummingbird", "Impala", "Jackal",
      "Kingfisher", "Lynx", "Mongoose", "Newt", "Ostrich", "Pelican", "Raven", "Scorpion"
    ]
  },
  {
    category: "Food & Drinks",
    words: [
      "Pizza", "Sushi", "Tacos", "Burger", "Croissant", "Ramen", "Lasagna", "Pancakes",
      "Espresso", "Smoothie", "Paella", "Falafel", "Fondue", "Gelato", "Hummus", "Kimchi",
      "Macarons", "Nachos", "Omelette", "Pretzel", "Quiche", "Risotto", "Shawarma", "Tiramisu",
      "Udon", "Waffles", "Xiaolongbao", "Yogurt", "Zucchini Bread", "Avocado Toast", "Baguette", "Ceviche",
      "Dim Sum", "Enchiladas", "French Fries", "Gnocchi", "Hot Dog", "Ice Cream Sundae", "Jambalaya", "Kebab",
      "Lobster Roll", "Matcha Latte", "Noodle Soup", "Onion Rings", "Pad Thai", "Quesadilla", "Ravioli", "Steak",
      "Teriyaki", "Vanilla Shake", "Wasabi Peas", "Yakitori", "Chai Latte", "Bubble Tea", "Apple Pie", "Brownie",
      "Cheesecake", "Donut", "Eclair", "Fruit Salad", "Guacamole", "Hash Browns", "Iced Coffee", "Jelly Bean",
      "Key Lime Pie", "Lemonade", "Miso Soup", "Nutella", "Oatmeal", "Popcorn", "Quinoa Salad", "Red Velvet Cake",
      "Samosa", "Tiramisu", "Wonton", "Zuppa Toscana", "Baklava", "Cannoli", "Dumplings", "Empanada"
    ]
  },
  {
    category: "Movies",
    words: [
      "Titanic", "Inception", "Avatar", "Gladiator", "Matrix", "Interstellar", "Jaws", "Jurassic Park",
      "Star Wars", "Harry Potter", "The Avengers", "The Dark Knight", "Forrest Gump", "Pulp Fiction", "The Godfather", "Fight Club",
      "Lord of the Rings", "Back to the Future", "Lion King", "Toy Story", "Frozen", "Shrek", "Pirates of the Caribbean", "Spider-Man",
      "Black Panther", "Indiana Jones", "Terminator", "Die Hard", "Alien", "The Shining", "Psycho", "Silence of the Lambs",
      "La La Land", "Whiplash", "Parasite", "Spirited Away", "WALL-E", "Up", "Coco", "Finding Nemo",
      "Monsters Inc", "Ratatouille", "Moana", "Zootopia", "The Incredibles", "Kung Fu Panda", "Despicable Me", "Madagascar",
      "Goodfellas", "Schindler's List", "Saving Private Ryan", "Braveheart", "1917", "Dunkirk", "Top Gun", "Mission Impossible",
      "James Bond", "Bourne Identity", "John Wick", "The Matrix Reloaded", "Django Unchained", "The Great Gatsby", "The Wolf of Wall Street", "Oppenheimer",
      "Barbie", "Dune", "Everything Everywhere", "Get Out", "Us", "Hereditary", "A Quiet Place", "Knives Out",
      "The Truman Show", "Catch Me If You Can", "The Green Mile", "The Prestige", "Memento", "Interstellar", "Drive", "Taxi Driver"
    ]
  },
  {
    category: "Countries",
    words: [
      "Japan", "Brazil", "Canada", "Australia", "France", "Egypt", "Italy", "India",
      "Norway", "Mexico", "Thailand", "Greece", "Argentina", "Switzerland", "South Korea", "Kenya",
      "Iceland", "New Zealand", "Portugal", "Vietnam", "Spain", "Germany", "United Kingdom", "United States",
      "China", "Russia", "South Africa", "Nigeria", "Colombia", "Peru", "Chile", "Morocco",
      "Turkey", "Saudi Arabia", "United Arab Emirates", "Indonesia", "Malaysia", "Singapore", "Philippines", "Pakistan",
      "Bangladesh", "Sri Lanka", "Nepal", "Maldives", "Austria", "Belgium", "Netherlands", "Sweden",
      "Finland", "Denmark", "Ireland", "Scotland", "Poland", "Czech Republic", "Hungary", "Croatia",
      "Greece", "Romania", "Ukraine", "Jamaica", "Cuba", "Costa Rica", "Panama", "Ecuador",
      "Bolivia", "Uruguay", "Paraguay", "Venezuela", "Madagascar", "Ethiopia", "Ghana", "Senegal",
      "Tanzania", "Uganda", "Zimbabwe", "Fiji", "Samoa", "Tahiti", "Monaco", "Vatican City"
    ]
  },
  {
    category: "Sports",
    words: [
      "Soccer", "Basketball", "Tennis", "Cricket", "Volleyball", "Baseball", "Golf", "Rugby",
      "Ice Hockey", "Swimming", "Badminton", "Table Tennis", "Boxing", "Surfing", "Skiing", "Snowboarding",
      "Formula 1", "Archery", "Fencing", "Gymnastics", "Karate", "Judo", "Taekwondo", "Skateboarding",
      "Rowing", "Sailing", "Water Polo", "Handball", "Squash", "Lacrosse", "Curling", "Bobsleigh",
      "Triathlon", "Marathon", "Pole Vault", "High Jump", "Long Jump", "Discus Throw", "Javelin Throw", "Weightlifting",
      "Wrestling", "MMA", "Kickboxing", "Sumo Wrestling", "Cycling", "BMX", "Motocross", "NASCAR",
      "Polo", "Equestrian", "Cricket", "Netball", "Ultimate Frisbee", "Dodgeball", "Paintball", "Parkour",
      "Rock Climbing", "Mountaineering", "Canoeing", "Kayaking", "Scuba Diving", "Kitesurfing", "Windsurfing", "Paddleboarding",
      "Figure Skating", "Speed Skating", "Luge", "Skeleton", "Biathlon", "Cross Country Skiing", "Darts", "Billiards",
      "Snooker", "Bowling", "American Football", "Australian Rules Football", "Gaelic Football", "Hurling", "Sepak Takraw", "Kabaddi"
    ]
  },
  {
    category: "Professions",
    words: [
      "Astronaut", "Architect", "Chef", "Detective", "Firefighter", "Pilot", "Surgeon", "Veterinarian",
      "Archaeologist", "Barista", "Electrician", "Geologist", "Journalist", "Librarian", "Mechanic", "Neurosurgeon",
      "Oceanographer", "Paramedic", "Software Engineer", "Tailor", "Animator", "Biologist", "Carpenter", "Dentist",
      "Flight Attendant", "Graphic Designer", "Historian", "Illustrator", "Judge", "Linguist", "Marine Biologist", "Nurse",
      "Optometrist", "Photographer", "Physicist", "Plumber", "Professor", "Robotics Engineer", "Sculptor", "Translator",
      "Voice Actor", "Web Developer", "Zoologist", "Accountant", "Actuary", "Agronomist", "Air Traffic Controller", "Banker",
      "Botanist", "Chemist", "Civil Engineer", "Cryptographer", "Data Scientist", "Economist", "Epidemiologist", "Event Planner",
      "Fashion Designer", "Financial Analyst", "Florist", "Forensic Scientist", "Geneticist", "Hotel Manager", "Interior Designer", "Investigative Reporter",
      "Landscape Architect", "Locksmith", "Meteorologist", "Microbiologist", "Music Producer", "Nutritionist", "Occupational Therapist", "Orthodontist",
      "Pharmacist", "Physiotherapist", "Pilot", "Psychologist", "Real Estate Agent", "Sound Engineer", "Statistician", "Urban Planner"
    ]
  },
  {
    category: "Vehicles",
    words: [
      "Submarine", "Helicopter", "Hovercraft", "Bicycle", "Electric Scooter", "Bulldozer", "Tractor", "Sailboat",
      "Speedboat", "Steam Locomotive", "Bullet Train", "Hot Air Balloon", "Zeppelin", "Spaceship", "Formula 1 Car", "Monster Truck",
      "Ambulance", "Fire Engine", "Police Cruiser", "School Bus", "Double-decker Bus", "Tuk Tuk", "Gondola", "Cable Car",
      "Unicycle", "Tricycle", "Skateboard", "Segway", "Snowmobile", "Jet Ski", "Yacht", "Cruise Ship",
      "Cargo Ship", "Aircraft Carrier", "Fighter Jet", "Glider", "Biplane", "Hang Glider", "Go-Kart", "Quad Bike",
      "Golf Cart", "Campervan", "Limousine", "Hearse", "Dump Truck", "Concrete Mixer", "Forklift", "Crane", "Excavator", "Street Sweeper",
      "Trolleybus", "Tram", "Monorail", "Rickshaw", "Kayak", "Canoe", "Paddleboat", "Raft", "Catamaran", "Hydrofoil",
      "Military Tank", "Armored Car", "Lunar Rover", "Space Shuttle", "Solar Plane", "Gyrocopter", "Motorcycle", "Chopper",
      "Moped", "Sidecar Motorcycle", "Caravan", "Flatbed Truck", "Garbage Truck", "Tow Truck", "Snowplow", "Bobsled",
      "Dog Sled", "Stagecoach", "Chariot", "Dugout Canoe", "Steamboat", "Submersible", "Dredger", "Icebreaker"
    ]
  },
  {
    category: "Nature & Geography",
    words: [
      "Waterfall", "Volcano", "Glacier", "Canyon", "Rainforest", "Coral Reef", "Fjord", "Geyser",
      "Desert", "Oasis", "Savanna", "Tundra", "Cave", "Iceberg", "Volcano", "Archipelago",
      "Atoll", "Bayou", "Estuary", "Hot Spring", "Lagoon", "Mangrove", "Mesa", "Mountain Range",
      "Peninsula", "Plateau", "Strait", "Swamp", "Valley", "Wetland", "Northern Lights", "Aurora Australis",
      "Supermoon", "Solar Eclipse", "Lunar Eclipse", "Meteor Shower", "Tornado", "Hurricane", "Tsunami", "Avalanche",
      "Whirlpool", "Sinkhole", "Petrified Forest", "Salt Flat", "Sand Dune", "Steppe", "Cenote", "Volcanic Crater",
      "Caldera", "Geothermal Field", "Submarine Trench", "Continental Shelf", "Barrier Reef", "Cloud Forest", "Redwood Forest", "Taiga",
      "Prairie", "Delta", "Gorge", "Cliff", "Basin", "Fossil Bed", "Thermal Vent", "Midnight Sun",
      "Bioluminescent Bay", "Sandbar", "Rapids", "Headland", "Pass", "Summit", "Peak", "Hills", "Crater Lake", "Permafrost Zone"
    ]
  },
  {
    category: "Technology & Gadgets",
    words: [
      "Smartphone", "Smartwatch", "Virtual Reality Headset", "Drone", "3D Printer", "Quantum Computer", "Supercomputer", "Autonomous Car",
      "Smart Speaker", "E-Reader", "Tablet", "Gaming Console", "Mechanical Keyboard", "Action Camera", "Noise Canceling Headphones", "Smart Thermostat",
      "Smart Lock", "Wireless Charger", "Fitness Tracker", "Augmented Reality Glasses", "Microcontroller", "Raspberry Pi", "Graphics Card", "Solid State Drive",
      "Satellite Phone", "Laser Cutter", "Robotic Vacuum", "Smart Ring", "Foldable Phone", "Electric Unicycle", "Hydrofoil Surfboard", "Digital Microscope",
      "Thermal Camera", "Biometric Scanner", "Fiber Optic Cable", "Solar Panel", "Powerbank", "Wi-Fi Router", "Bluetooth Beacon", "Smart Ring Light",
      "Portable Projector", "Dashcam", "Brain Computer Interface", "Holographic Display", "Smart Glasses", "Exoskeleton Suit", "Underwater Drone", "Smart Pet Feeder",
      "Wireless Earbuds", "Stylus Pen", "Trackball Mouse", "Stream Deck", "Capture Card", "External Hard Drive", "Smart Light Strip", "Smart Doorbell",
      "Satellite Dish", "Portable Power Station", "Action Cam Gimbal", "Digital Drawing Pad", "Barcode Scanner", "3D Scanner", "VR Motion Controller", "Smart Plant Sensor"
    ]
  },
  {
    category: "Music & Instruments",
    words: [
      "Saxophone", "Violin", "Grand Piano", "Electric Guitar", "Accordion", "Bagpipes", "Cello", "Didgeridoo",
      "Flute", "Harp", "Harmonica", "Marimba", "Oboe", "Sitar", "Trombone", "Ukulele", "Xylophone", "Synthesizer",
      "Djembe", "Banjo", "Clarinet", "Double Bass", "French Horn", "Glockenspiel", "Kazoo", "Lute",
      "Mandolin", "Pan Flute", "Recorder", "Steel Drum", "Theremin", "Tpani", "Triangle", "Tuba",
      "Vibraphone", "Zither", "Bass Guitar", "Bongos", "Congas", "Castanets", "Cymbal", "Drum Kit",
      "Electric Organ", "Euphonium", "Fiddle", "Harpsichord", "Kalimba", "Keytar", "Lyre", "Melodica",
      "Ocarina", "Pipe Organ", "Piccolo", "Tambourine", "Timbales", "Trumpet", "Turntable", "Viola",
      "Snare Drum", "Bass Drum", "Gong", "Sleigh Bells", "Tubular Bells", "Vibraphone", "Cajon", "Balalaika"
    ]
  },
  {
    category: "Clothing & Accessories",
    words: [
      "Tuxedo", "Kimono", "Kilt", "Poncho", "Fedora", "Bowtie", "High Heels", "Sneakers",
      "Trench Coat", "Leather Jacket", "Overalls", "Sombrero", "Beret", "Parka", "Cardigan", "Blazer",
      "Dungarees", "Espadrilles", "Fleece Vest", "Gauntlets", "Headband", "Inverted Umbrella", "Jumpsuit", "Kaftan",
      "Leggings", "Moccasins", "Necktie", "Oxford Shoes", "Pajamas", "Raincoat", "Sandals", "Turtleneck",
      "Ushanka Hat", "Visor", "Windbreaker", "Waistcoat", "Bandana", "Beanie", "Boots", "Cufflinks",
      "Earmuffs", "Fingerless Gloves", "Goggles", "Hairclip", "Locket", "Mittens", "Nightgown", "Polo Shirt",
      "Scarf", "Sunglasses", "Suspenders", "Thermal Underwear", "Top Hat", "Tracksuit", "Trousers", "Wellington Boots"
    ]
  },
  {
    category: "Household Items",
    words: [
      "Espresso Machine", "Microwave", "Air Fryer", "Dishwasher", "Vacuum Cleaner", "Washing Machine", "Refrigerator", "Toaster", "Blender", "Juicer",
      "Food Processor", "Electric Kettle", "Slow Cooker", "Rice Cooker", "Waffle Maker", "Ironing Board", "Clothes Steamer", "Ceiling Fan", "Air Conditioner", "Dehumidifier",
      "Humidifier", "Space Heater", "Alarm Clock", "Wall Mirror", "Bookshelf", "Coffee Table", "Recliner Armchair", "Standing Lamp", "Chandelier", "Curtains",
      "Duvet", "Memory Foam Pillow", "Mattress", "Wardrobe", "Coat Rack", "Shoe Cabinet", "Trash Can", "Recycling Bin", "Fire Extinguisher", "First Aid Kit",
      "Smoke Detector", "Water Filter Pitcher", "Cutlery Set", "Cutting Board", "Frying Pan", "Pressure Cooker", "Whisk", "Rolling Pin", "Colander", "Measuring Cups"
    ]
  },
  {
    category: "Famous People & Figures",
    words: [
      "Albert Einstein", "Leonardo da Vinci", "Cleopatra", "William Shakespeare", "Isaac Newton", "Marie Curie", "Mozart", "Beethoven",
      "Nikola Tesla", "Charles Darwin", "Galileo Galilei", "Aristotle", "Plato", "Socrates", "Alexander the Great", "Julius Caesar",
      "Napoleon Bonaparte", "Joan of Arc", "Mahatma Gandhi", "Nelson Mandela", "Martin Luther King Jr", "Abraham Lincoln", "George Washington", "Winston Churchill",
      "Franklin D Roosevelt", "Theodore Roosevelt", "Queen Elizabeth II", "Princess Diana", "Christopher Columbus", "Marco Polo", "Ferdinand Magellan", "Neil Armstrong",
      "Yuri Gagarin", "Wright Brothers", "Thomas Edison", "Alexander Graham Bell", "Henry Ford", "Steve Jobs", "Bill Gates", "Ada Lovelace",
      "Alan Turing", "Stephen Hawking", "Pablo Picasso", "Vincent van Gogh", "Claude Monet", "Michelangelo", "Rembrandt", "Frida Kahlo"
    ]
  },
  {
    category: "Video Games",
    words: [
      "Minecraft", "The Legend of Zelda", "Super Mario Bros", "Tetris", "Grand Theft Auto", "Pokémon", "Call of Duty", "Fortnite",
      "World of Warcraft", "League of Legends", "Dota 2", "Counter-Strike", "Minecraft", "Overwatch", "Valorant", "Apex Legends",
      "PUBG", "Rocket League", "Fall Guys", "Among Us", "Cyberpunk 2077", "The Witcher 3", "Elden Ring", "Dark Souls",
      "Bloodborne", "Skyrim", "Fallout 4", "Red Dead Redemption 2", "God of War", "The Last of Us", "Uncharted", "Horizon Zero Dawn",
      "Ghost of Tsushima", "Halo", "Gears of War", "Forza Horizon", "Gran Turismo", "Need for Speed", "Final Fantasy", "Kingdom Hearts",
      "Resident Evil", "Silent Hill", "Metal Gear Solid", "Assassins Creed", "Far Cry", "Watch Dogs", "Tomb Raider", "Metroid Prime"
    ]
  },
  {
    category: "Science & Space",
    words: [
      "Supernova", "Black Hole", "Nebula", "Exoplanet", "Neutron Star", "Quasar", "Asteroid Belt", "Comet",
      "Hubble Telescope", "James Webb Telescope", "International Space Station", "Hadron Collider", "Quantum Entanglement", "DNA Double Helix", "CRISPR", "Particle Accelerator",
      "Dark Matter", "Dark Energy", "Gravitational Waves", "Solar Flare", "Coronal Mass Ejection", "Magnetic Field", "Atmosphere", "Ozone Layer",
      "Geothermal Vent", "Tectonic Plate", "Photosynthesis", "Cellular Respiration", "Mitosis", "Meiosis", "Enzyme", "Chromosome",
      "Genome", "Ribosome", "Mitochondria", "Chloroplast", "Antibody", "Pathogen", "Superconductor", "Semiconductor",
      "Nanotechnology", "Graphene", "Bose-Einstein Condensate", "Higgs Boson", "Photon", "Electron", "Proton", "Neutron"
    ]
  },
  {
    category: "Superheroes & Fiction",
    words: [
      "Spider-Man", "Batman", "Iron Man", "Superman", "Wonder Woman", "Thor", "Captain America", "Hulk",
      "Wolverine", "Doctor Strange", "Black Panther", "Flash", "Aquaman", "Green Lantern", "Deadpool", "Daredevil",
      "Green Arrow", "Captain Marvel", "Ant-Man", "Black Widow", "Hawkeye", "Vision", "Scarlet Witch", "Star-Lord",
      "Groot", "Rocket Raccoon", "Gamora", "Drax", "Shazam", "Supergirl", "Batgirl", "Nightwing",
      "Cyclops", "Jean Grey", "Storm", "Rogue", "Gambit", "Beast", "Professor X", "Magneto",
      "Loki", "Thanos", "Joker", "Venom", "Green Goblin", "Doctor Octopus", "Riddler", "Penguin"
    ]
  }
];
