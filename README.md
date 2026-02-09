# Gem-Chef: AI-Powered Smart Kitchen Assistant

## Introduction
Gem-Chef is an advanced, AI-driven kitchen management and cooking assistant designed to reduce food waste, simplify meal planning, and elevate the home cooking experience. By leveraging the cutting-edge **Google Gemini 3 Preview** models (Pro & Flash), Gem-Chef transforms how users interact with their kitchen—from scanning grocery bills to generating step-by-step cooking guides with real-time visual feedback.

## Problem Statement
Modern home cooking faces several challenges:
*   **Food Waste**: Ingredients often expire before use due to poor inventory tracking.
*   **Decision Fatigue**: "What should I cook?" is a daily dilemma, often leading to unhealthy takeout choices.
*   **Skill Gaps**: Beginners struggle with complex recipes and lack real-time guidance.
*   **Disorganized Planning**: Managing grocery lists, nutrition goals, and meal schedules is often fragmented across multiple apps or mental notes.

## Solution
Gem-Chef solves these problems by integrating AI into every stage of the cooking process:
*   **Smart Inventory**: Automatically tracks ingredients and expiry dates via bill scanning.
*   **Intelligent Recipe Generation**: Creates custom recipes based on what you have, reducing waste.
*   **Real-time Assistance**: Provides voice-guided cooking instructions and visual verification of cooking steps.
*   **Holistic Management**: Combines meal planning, nutrition tracking, and shopping lists in one platform.

## Key Features

### 1. Smart Inventory Management
*   **Bill Scanning**: Users can upload grocery bills, and Gem-Chef uses OCR (Optical Character Recognition) via Gemini Vision to automatically populate the inventory with items and quantities.
*   **Expiry Tracking**: AI suggests expiry dates for items, alerting users before food goes bad.
*   **Manual Entry**: Users can also add items manually with categorization (Produce, Dairy, Spices, etc.).
*   **Low Stock Alerts**: Notifies users when essentials are running low.

### 2. AI Recipe Generation
*   **Ingredient-Based Recipes**: Generates recipes using only the ingredients currently available in the user's inventory.
*   **"Describe a Dish"**: Users can describe a craving (e.g., "spicy pasta with creamy sauce"), and the AI generates a specific recipe to match.
*   **Dietary Customization**: Tailors recipes for specific diets (Vegetarian, Vegan, Keto, etc.), allergies, and health conditions (Diabetes, Hypertension).
*   **Gourmet Mode**: Transforms basic ingredients into chef-quality meals with creative twists.

### 3. Interactive Cooking Mode
*   **Step-by-Step Guidance**: The application reads out instructions step-by-step, allowing for hands-free cooking.
*   **Visual Verification**: Users can snap a photo of their cooking at any step. Gemini Vision analyzes the image to verify if the step was completed correctly (e.g., "Onions are golden brown") and provides real-time feedback.
*   **Timers**: Built-in timers for specific steps (e.g., "Simmer for 10 minutes").

### 4. Meal Planner & Shopping List
*   **Smart Planning**: Generates 3-day or weekly meal plans based on user preferences and inventory.
*   **Automated Grocery Lists**: Creates a consolidated shopping list for missing ingredients required for the planned meals.
*   **WhatsApp Integration**: Users can share their meal plans and grocery lists via WhatsApp.

### 5. Nutrition Tracker
*   **Macro Tracking**: Automatically calculates calories, protein, carbs, and fats for every recipe cooked.
*   **Daily Logs**: Tracks daily intake against user-set goals.
*   **Progress Visualization**: Displays weekly consumption trends and adherence to diet plans.

### 6. Worldwide Cuisine Explorer
*   **Global Dishes**: Allows users to explore recipes from specific countries.
*   **Cultural Context**: Provides information on traditional, seasonal, and trending dishes from the selected region.
*   **Recipe Generation**: Instantly generates recipes for any discovered international dish.

### 7. "My Recipes" & Cooklog
*   **Recipe Book**: Users can save their favorite generated recipes.
*   **Editing**: Saved recipes can be customized and updated.
*   **Cooklog**: A history of all cooked meals with dates and times.

## Powered by Google Gemini 3
Gem-Chef is built on the foundation of Google's latest **Gemini 3 Preview** models, utilizing their multimodal capabilities to deliver features that standard text-based AI cannot achieve.

### Why Gemini 3?
*   **Multimodal Reasoning (Text + Vision)**:
    *   **Ingredient Recognition**: Instead of typing, users can snap a photo of their pantry or fridge. Gemini Vision identifies ingredients instantly (`gemini-pro-vision`).
    *   **Cooking Step Verification**: During cooking mode, the AI analyzes real-time photos of the pan to determine if the food is cooked correctly (e.g., identifying "soft peaks" in egg whites or "caramelization" on onions), acting as a virtual sous-chef.
    *   **Bill Scanning**: High-accuracy OCR extracts structured data (item names, quantities, prices) from complex receipts images.

*   **Advanced Context Window & Reasoning**:
    *   **Complex Dietary Handling**: The model processes intricate combinations of user constraints (e.g., "Vegetarian, Diabetic, High Protein, avoid Mushrooms") simultaneously to generate safe, delicious recipes.
    *   **Creative "Gourmet" Logic**: The AI understands culinary theory, allowing it to suggest creative substitutions and gourmet transformations for basic ingredients.

*   **Performance & Latency**:
    *   **Real-Time Interaction**: By leveraging `gemini-3-flash-preview`, the application provides near-instant responses for search and chat interactions, critical for a smooth user experience in the kitchen.

## Repository Structure

```
Gem-Chef/
├── app/
│   ├── analytics/       # User cooking stats and progress visualization
│   ├── cook/            # Interactive voice-guided cooking & visual verification
│   ├── cook-along/      # Video recipe integration for learning
│   ├── cooklog/         # History of cooked meals
│   ├── describe/        # "Describe a Dish" prompt interface
│   ├── gourmet/         # Advanced recipe transformation logic
│   ├── inventory/       # Pantry management & bill scanning (OCR)
│   ├── meal-planner/    # AI-driven weekly meal planning & grocery lists
│   ├── my-recipes/      # User's saved recipe collection & editing
│   ├── nutrition/       # Macro tracking & dietary logs
│   ├── scan/            # Ingredient recognition via camera
│   ├── worldwide/       # Global cuisine explorer & cultural dishes
│   ├── globals.css      # Tailwind global styles
│   ├── layout.tsx       # Root layout & providers
│   └── page.tsx         # Landing page
├── utils/
│   ├── gemini.ts        # Core AI logic (Model configuration, Vision, Prompt Engineering)
│   ├── inventory.ts     # Inventory data management utilities
│   ├── nutrition-storage.ts # LocalStorage wrappers for nutrition data
│   ├── reminders.ts     # Expiry notification logic
│   ├── voice.ts         # Text-to-Speech (TTS) configuration
│   └── ...
├── public/              # Static assets (images, icons)
├── package.json         # Dependencies & scripts
└── README.md            # Project documentation
```

## Tech Stack

*   **Frontend Framework**: Next.js 14 (App Router)
*   **Language**: TypeScript
*   **Styling**: React, Tailwind CSS
*   **AI Models**: Google Gemini 3 Pro Preview & Gemini 3 Flash Preview (Text & Vision)
*   **Icons**: Lucide React
*   **State Management**: React Hooks (useState, useEffect, useReducer)
*   **Persistence**: LocalStorage & SessionStorage (Client-side only for privacy)

## Installation & Setup

Follow these steps to run Gem-Chef locally:

1.  **Clone the Repository**
    ```bash
    git clone <repository-url>
    cd Gem-Chef
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env.local` file in the root directory and add your Google Gemini API key:
    ```bash
    GEMINI_API_KEY=your_api_key_here
    # Optional: Add multiple keys for rotation
    # GEMINI_API_KEYS=key1,key2,key3
    ```

4.  **Run the Development Server**
    ```bash
    npm run dev
    ```

5.  **Open the Application**
    Open your browser and navigate to `http://localhost:3000` to start using Gem-Chef.

## License
This project is for educational and portfolio purposes. All AI-generated content should be verified for safety before use.
