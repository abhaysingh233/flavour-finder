  // Edamam API credentials (Note: In production, these should be handled server-side)
        const APP_ID = "YOUR_APP_ID"; // Replace with your Edamam app_id
        const APP_KEY = "YOUR_APP_KEY"; // Replace with your Edamam app_key
        const BASE_URL = "https://api.edamam.com/api/recipes/v2";

        // DOM Elements
        const searchForm = document.getElementById('searchForm');
        const ingredientsInput = document.getElementById('ingredientsInput');
        const resultsSection = document.getElementById('resultsSection');
        const resultsGrid = document.getElementById('resultsGrid');
        const resultsCount = document.getElementById('resultsCount');
        const noResults = document.getElementById('noResults');
        const loadingIndicator = document.getElementById('loadingIndicator');
        const filtersSection = document.getElementById('filters');
        const filterButtons = document.querySelectorAll('.filter-btn');
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        const recipeModal = document.getElementById('recipeModal');
        const closeModalBtn = document.getElementById('closeModalBtn');
        const modalContent = document.getElementById('modalContent');
        const advancedOptionsToggle = document.getElementById('advancedOptionsToggle');
        const advancedOptions = document.getElementById('advancedOptions');
        const cuisineTypeSelect = document.getElementById('cuisineType');
        const mealTypeSelect = document.getElementById('mealType');
        const dietSelect = document.getElementById('diet');
        const healthSelect = document.getElementById('health');
        const sortBySelect = document.getElementById('sortBy');

        // State variables
        let currentRecipes = [];
        let nextPageUrl = '';
        let currentFilters = {
            cuisineType: '',
            mealType: '',
            diet: '',
            health: ''
        };

        // Event Listeners
        searchForm.addEventListener('submit', handleSearch);
        loadMoreBtn.addEventListener('click', loadMoreRecipes);
        closeModalBtn.addEventListener('click', () => recipeModal.classList.add('hidden'));
        advancedOptionsToggle.addEventListener('click', toggleAdvancedOptions);
        sortBySelect.addEventListener('change', () => sortRecipes(sortBySelect.value));

        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active-filter'));
                btn.classList.add('active-filter');
                filterRecipes(btn.dataset.filter);
            });
        });

        // Functions
        function toggleAdvancedOptions() {
            advancedOptions.classList.toggle('hidden');
            advancedOptionsToggle.textContent = 
                advancedOptions.classList.contains('hidden') ? 
                "+ Advanced Options" : 
                "− Advanced Options";
        }

        async function handleSearch(e) {
            e.preventDefault();
            
            const ingredients = ingredientsInput.value.trim();
            if (!ingredients) {
                alert('Please enter at least one ingredient');
                return;
            }

            // Update current filters
            currentFilters = {
                cuisineType: cuisineTypeSelect.value,
                mealType: mealTypeSelect.value,
                diet: dietSelect.value,
                health: healthSelect.value
            };

            loadingIndicator.classList.remove('hidden');
            resultsSection.classList.add('hidden');
            noResults.classList.add('hidden');

            try {
                const url = buildSearchUrl(ingredients);
                const data = await fetchRecipes(url);
                
                currentRecipes = data.hits || [];
                nextPageUrl = data._links?.next?.href || '';
                
                displayResults(currentRecipes);
                
                if (currentRecipes.length > 0) {
                    filtersSection.classList.remove('hidden');
                } else {
                    noResults.classList.remove('hidden');
                }
                
                loadingIndicator.classList.add('hidden');
                resultsSection.classList.remove('hidden');
            } catch (error) {
                console.error("Error fetching recipes:", error);
                loadingIndicator.classList.add('hidden');
                noResults.classList.remove('hidden');
            }
        }

        function buildSearchUrl(ingredients) {
            const params = new URLSearchParams();
            params.append('type', 'public');
            params.append('q', ingredients);
            
            if (currentFilters.cuisineType) {
                params.append('cuisineType', currentFilters.cuisineType.toLowerCase());
            }
            if (currentFilters.mealType) {
                params.append('mealType', currentFilters.mealType.toLowerCase());
            }
            if (currentFilters.diet) {
                params.append('diet', currentFilters.diet);
            }
            if (currentFilters.health) {
                params.append('health', currentFilters.health);
            }
            
            return `${BASE_URL}?${params.toString()}&app_id=${APP_ID}&app_key=${APP_KEY}`;
        }

        async function fetchRecipes(url) {
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`API request failed with status ${response.status}`);
                }
                return await response.json();
            } catch (error) {
                throw error;
            }
        }

        function displayResults(recipes) {
            resultsGrid.innerHTML = '';
            
            if (recipes.length === 0) {
                noResults.classList.remove('hidden');
                resultsCount.textContent = "0 Recipes Found";
                loadMoreBtn.classList.add('hidden');
                return;
            }
            
            recipes.forEach(recipe => {
                const recipeCard = createRecipeCard(recipe);
                resultsGrid.appendChild(recipeCard);
            });
            
            resultsCount.textContent = `${recipes.length} ${recipes.length === 1 ? 'Recipe' : 'Recipes'} Found`;
            loadMoreBtn.classList.toggle('hidden', !nextPageUrl);
        }

        function createRecipeCard(recipeHit) {
            const recipe = recipeHit.recipe;
            
            const card = document.createElement('div');
            card.className = 'recipe-card bg-white rounded-lg overflow-hidden shadow-md transition duration-300 hover:shadow-lg';
            
            const tags = [];
            if (recipe.healthLabels.includes('Vegetarian')) tags.push('vegetarian');
            if (recipe.healthLabels.includes('Vegan')) tags.push('vegan');
            if (recipe.totalTime < 30) tags.push('quick');
            if (recipe.healthLabels.includes('Low-Fat') || recipe.healthLabels.includes('Low-Sodium') || recipe.healthLabels.includes('Sugar-Conscious')) {
                tags.push('healthy');
            }
            
            card.dataset.tags = tags.join(' ');
            
            card.innerHTML = `
                <div class="relative">
                    <img src="${recipe.image || 'https://placehold.co/600x400'}" 
                         alt="${recipe.label} - ${recipe.ingredientLines.slice(0, 3).join(', ')}"
                         class="w-full h-48 object-cover">
                    <div class="absolute top-2 right-2 bg-white bg-opacity-80 px-2 py-1 rounded-full text-xs font-medium">
                        ${Math.round(recipe.calories / recipe.yield)} kcal
                    </div>
                </div>
                <div class="p-4">
                    <h3 class="text-lg font-semibold text-gray-800 mb-2 truncate">${recipe.label}</h3>
                    <div class="flex items-center text-sm text-gray-600 mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        ${recipe.totalTime > 0 ? recipe.totalTime + ' mins' : 'N/A'}
                    </div>
                    <div class="flex flex-wrap gap-1 mb-4">
                        ${recipe.dishType?.slice(0, 3).map(type => 
                            `<span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">${type}</span>`
                        ).join('') || ''}
                    </div>
                    <button class="view-recipe-btn w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition duration-200"
                            data-id="${recipeHit._links.self.href}">
                        View Recipe
                    </button>
                </div>
            `;
            
            card.querySelector('.view-recipe-btn').addEventListener('click', () => showRecipeDetails(recipeHit));
            
            return card;
        }

        async function showRecipeDetails(recipeHit) {
            loadingIndicator.classList.remove('hidden');
            recipeModal.classList.remove('hidden');
            
            try {
                const recipe = recipeHit.recipe;
                
                modalContent.innerHTML = `
                    <div class="sticky top-0">
                        <img src="${recipe.image || 'https://placehold.co/800x600'}" 
                             alt="${recipe.label} - close-up of prepared dish"
                             class="w-full h-64 lg:h-80 object-cover rounded-lg mb-6">
                        <div class="bg-gray-100 rounded-lg p-4 mb-6">
                            <div class="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <div class="font-medium text-blue-600">${Math.round(recipe.calories / recipe.yield)}</div>
                                    <div class="text-xs text-gray-500">CALORIES</div>
                                </div>
                                <div>
                                    <div class="font-medium text-blue-600">${recipe.totalTime || 'N/A'}</div>
                                    <div class="text-xs text-gray-500">MINS</div>
                                </div>
                                <div>
                                    <div class="font-medium text-blue-600">${recipe.yield || 'N/A'}</div>
                                    <div class="text-xs text-gray-500">SERVINGS</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h2 class="text-2xl font-bold text-gray-800 mb-4">${recipe.label}</h2>
                        
                        <div class="mb-6">
                            <h3 class="text-lg font-semibold text-gray-800 mb-2">Ingredients</h3>
                            <ul class="list-disc pl-5 space-y-1">
                                ${recipe.ingredientLines.map(ingredient => 
                                    `<li class="text-gray-700">${ingredient}</li>`
                                ).join('')}
                            </ul>
                        </div>
                        
                        ${recipe.healthLabels.length > 0 ? `
                        <div class="mb-6">
                            <h3 class="text-lg font-semibold text-gray-800 mb-2">Dietary Information</h3>
                            <div class="flex flex-wrap gap-2">
                                ${recipe.healthLabels.slice(0, 8).map(label => 
                                    `<span class="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">${label}</span>`
                                ).join('')}
                            </div>
                        </div>
                        ` : ''}
                        
                        <div class="flex justify-center mt-6">
                            <a href="${recipe.url}" target="_blank" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200">
                                View Full Recipe on ${recipe.source}
                            </a>
                        </div>
                    </div>
                `;
            } catch (error) {
                console.error("Error loading recipe details:", error);
                modalContent.innerHTML = `
                    <div class="col-span-full text-center py-12">
                        <img src="https://placehold.co/300x200" alt="Broken plate illustration indicating error loading recipe" class="mx-auto mb-6" />
                        <h4 class="text-xl font-medium text-gray-700 mb-2">Error Loading Recipe</h4>
                        <p class="text-gray-500 max-w-md mx-auto">We encountered an issue loading this recipe. Please try again later.</p>
                    </div>
                `;
            } finally {
                loadingIndicator.classList.add('hidden');
            }
        }

        async function loadMoreRecipes() {
            if (!nextPageUrl) return;
            
            loadMoreBtn.disabled = true;
            loadMoreBtn.innerHTML = 'Loading...';
            
            try {
                const data = await fetchRecipes(nextPageUrl);
                const newRecipes = data.hits || [];
                
                newRecipes.forEach(recipe => {
                    const recipeCard = createRecipeCard(recipe);
                    resultsGrid.appendChild(recipeCard);
                });
                
                currentRecipes = [...currentRecipes, ...newRecipes];
                nextPageUrl = data._links?.next?.href || '';
                resultsCount.textContent = `${currentRecipes.length} Recipes Found`;
                loadMoreBtn.classList.toggle('hidden', !nextPageUrl);
            } catch (error) {
                console.error("Error loading more recipes:", error);
            } finally {
                loadMoreBtn.disabled = false;
                loadMoreBtn.innerHTML = 'Load More Recipes';
            }
        }

        function filterRecipes(filter) {
            const recipeCards = document.querySelectorAll('#resultsGrid .recipe-card');
            
            recipeCards.forEach(card => {
                if (filter === 'all' || card.dataset.tags.includes(filter)) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            });
            
            const visibleCount = document.querySelectorAll('#resultsGrid .recipe-card:not(.hidden)').length;
            resultsCount.textContent = `${visibleCount} ${visibleCount === 1 ? 'Recipe' : 'Recipes'} Found`;
        }

        function sortRecipes(sortBy) {
            const container = document.getElementById('resultsGrid');
            const cards = Array.from(document.querySelectorAll('.recipe-card'));
            
            cards.sort((a, b) => {
                switch(sortBy) {
                    case 'calories':
                        const aCal = parseInt(a.querySelector('.absolute').textContent.match(/\d+/)[0]);
                        const bCal = parseInt(b.querySelector('.absolute').textContent.match(/\d+/)[0]);
                        return aCal - bCal;
                    case 'time':
                        const aTime = parseInt(a.querySelector('.flex.items-center').textContent.match(/\d+/)[0]) || 0;
                        const bTime = parseInt(b.querySelector('.flex.items-center').textContent.match(/\d+/)[0]) || 0;
                        return aTime - bTime;
                    case 'relevance':
                    default:
                        return 0; // Default order from API
                }
            });
            
            // Clear container and append sorted cards
            container.innerHTML = '';
            cards.forEach(card => container.appendChild(card));
        }

        // Demo function to simulate API call with mock data (for testing)
        function getMockRecipes() {
            return {
                hits: [
                    {
                        recipe: {
                            label: "Spaghetti Carbonara",
                            image: "https://placehold.co/600x400",
                            calories: 1200,
                            yield: 2,
                            totalTime: 30,
                            ingredientLines: ["200g spaghetti", "100g pancetta", "2 eggs", "50g parmesan"],
                            healthLabels: ["High-Protein", "Vegetarian"],
                            dishType: ["main course"],
                            url: "https://example.com",
                            source: "Example Recipes"
                        },
                        _links: {
                            self: {
                                href: "https://api.edamam.com/api/recipes/v2/spaghetti-carbonara"
                            }
                        }
                    }
                ]
            };
        }