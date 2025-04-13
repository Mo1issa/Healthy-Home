// Healthy Home - With CalorieNinjas API 

const searchInput = document.getElementById("searchInput");
const mealDisplay = document.querySelector(".mealDisplay");
const toggleSelectedButton = document.querySelector(".toggleSelectedButton");

const CALORIE_NINJAS_API_KEY = "aLngFOkC/xVIKLHDRe8muQ==avYp6lLPZ4MCSzKG"; // Replace with your actual CalorieNinjas API key

let mealsData = [];
let selectedMeals = JSON.parse(localStorage.getItem("selectedMeals")) || [];
let displayingSelected = false;

function toggleFavorite(button, meal) {
  const mealIndex = selectedMeals.findIndex((item) => item.idMeal === meal.idMeal);
  if (mealIndex !== -1) {
    selectedMeals.splice(mealIndex, 1);
  } else {
    selectedMeals.push(meal);
  }

  const mealDataIndex = mealsData.findIndex((item) => item.idMeal === meal.idMeal);
  if (mealDataIndex !== -1) {
    mealsData[mealDataIndex].selected = !mealsData[mealDataIndex].selected;
  }

  localStorage.setItem("selectedMeals", JSON.stringify(selectedMeals));
  displayingSelected ? displaySelectedMeals() : fetchMeals(searchInput.value.trim());
}

function removeFromSelectedMeals(meal) {
  const mealIndex = selectedMeals.findIndex((item) => item.idMeal === meal.idMeal);
  if (mealIndex !== -1) {
    selectedMeals.splice(mealIndex, 1);
    const mealDataIndex = mealsData.findIndex((item) => item.idMeal === meal.idMeal);
    if (mealDataIndex !== -1) {
      mealsData[mealDataIndex].selected = false;
    }
    localStorage.setItem("selectedMeals", JSON.stringify(selectedMeals));
    displaySelectedMeals();
  }
}

async function getCaloriesFromNinja(ingredientText) {
  try {
    const response = await fetch(`https://api.calorieninjas.com/v1/nutrition?query=${encodeURIComponent(ingredientText)}`, {
      headers: { 'X-Api-Key': CALORIE_NINJAS_API_KEY }
    });

    if (!response.ok) {
      console.error("CalorieNinjas Error", response.statusText);
      return null;
    }

    const data = await response.json();
    const totalCalories = data.items.reduce((sum, item) => sum + item.calories, 0);
    return totalCalories;
  } catch (err) {
    console.error("Calorie Fetch Error", err);
    return null;
  }
}

function fetchMealDetails(mealId) {
  fetch(`https://themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`)
    .then((response) => response.json())
    .then((data) => {
      if (!data.meals) return;

      const mealDetails = data.meals[0];
      const ingredients = [];

      for (let i = 1; i <= 20; i++) {
        const ingredient = mealDetails[`strIngredient${i}`]?.trim();
        const measure = mealDetails[`strMeasure${i}`]?.trim() || "";
        if (ingredient && ingredient.toLowerCase() !== "null") {
          const formatted = `${measure} ${ingredient}`.trim().replace(/\s+/g, ' ');
          if (formatted) ingredients.push(formatted);
        }
      }

      const ingredientQuery = ingredients.join(", ");

      getCaloriesFromNinja(ingredientQuery).then((calories) => {
        const mealDetailsHTML = `
          <div class="mealDetails">
            <img src="${mealDetails.strMealThumb}" alt="${mealDetails.strMeal}">
            <div class="detailsWrapper">
              <h2>${mealDetails.strMeal}</h2>
              <p><strong>Category:</strong> ${mealDetails.strCategory}</p>
              <p><strong>Area:</strong> ${mealDetails.strArea}</p>
              <p><strong>Tags:</strong> ${mealDetails.strTags || "N/A"}</p>
              <p><strong>Calories:</strong> ${calories !== null ? calories.toFixed(0) + " kcal" : "Not available"}</p>
              <p><strong>Ingredients:</strong></p>
              <ul>${ingredients.map(i => `<li>${i}</li>`).join("")}</ul>
              <p><strong>Instructions:</strong> ${mealDetails.strInstructions}</p>
              ${mealDetails.strYoutube ? `<a href="${mealDetails.strYoutube}" target="_blank">Watch Video</a>` : ''}
              <button class="goBackButton">Go Back</button>
            </div>
          </div>`;

        mealDisplay.innerHTML = mealDetailsHTML;
      });
    })
    .catch((error) => {
      console.error("Details Error:", error);
      mealDisplay.innerHTML = `<p class="error">Error loading details. Please try again.</p>`;
    });
}

function fetchMeals(value) {
  if (value === "") {
    fetchRandomMeals();
    return;
  }

  fetch(`https://themealdb.com/api/json/v1/1/search.php?s=${value}`)
    .then((response) => response.json())
    .then((data) => {
      if (!data.meals) {
        mealDisplay.innerHTML = "<h2>No meals found.</h2>";
      } else {
        mealsData = data.meals.map((meal) => ({
          ...meal,
          selected: selectedMeals.some((selectedMeal) => selectedMeal.idMeal === meal.idMeal),
        }));

        const mealHTML = mealsData.map((meal) => `
          <div class="meal">
            <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
            <div class="wrapper">
              <h3>${meal.strMeal.length > 10 ? meal.strMeal.slice(0, 10) + "..." : meal.strMeal}</h3>
              <button class="addToList ${meal.selected ? "selected" : ""}"><i class="fa-solid fa-heart fav"></i></button>
              <button class="viewDetails"><i class="fa-solid fa-eye"></i></button>
            </div>
          </div>`).join("");

        mealDisplay.innerHTML = mealHTML;

        document.querySelectorAll(".addToList").forEach((button, index) => {
          button.addEventListener("click", () => {
            const selectedMeal = mealsData[index];
            toggleFavorite(button, selectedMeal);
          });
        });

        document.querySelectorAll(".viewDetails").forEach((button, index) => {
          button.addEventListener("click", () => {
            const selectedMeal = mealsData[index];
            fetchMealDetails(selectedMeal.idMeal);
            searchInput.disabled = true;
          });
        });
      }
    })
    .catch((error) => {
      console.error("Error fetching meals:", error);
      mealDisplay.innerHTML = "<p>Error fetching meals. Please try again later.</p>";
    });
}

function fetchRandomMeals(count = 15) {
  mealDisplay.innerHTML = "<p>Loading meals...</p>";
  const promises = [];
  for (let i = 0; i < count; i++) {
    promises.push(fetch("https://www.themealdb.com/api/json/v1/1/random.php").then(res => res.json()));
  }

  Promise.all(promises)
    .then(results => {
      const randomMeals = results.map(r => r.meals[0]);
      mealsData = randomMeals.map(meal => ({
        ...meal,
        selected: selectedMeals.some(selected => selected.idMeal === meal.idMeal)
      }));

      const mealHTML = mealsData.map(meal => `
        <div class="meal">
          <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
          <div class="wrapper">
            <h3>${meal.strMeal.length > 10 ? meal.strMeal.slice(0, 10) + "..." : meal.strMeal}</h3>
            <button class="addToList ${meal.selected ? "selected" : ""}"><i class="fa-solid fa-heart fav"></i></button>
            <button class="viewDetails"><i class="fa-solid fa-eye"></i></button>
          </div>
        </div>`).join("");

      mealDisplay.innerHTML = mealHTML;

      document.querySelectorAll(".addToList").forEach((button, index) => {
        button.addEventListener("click", () => toggleFavorite(button, mealsData[index]));
      });

      document.querySelectorAll(".viewDetails").forEach((button, index) => {
        button.addEventListener("click", () => {
          fetchMealDetails(mealsData[index].idMeal);
          searchInput.disabled = true;
        });
      });
    })
    .catch(error => {
      console.error("Failed to fetch random meals", error);
      mealDisplay.innerHTML = "<p>Error loading random meals.</p>";
    });
}

function handleToggleSelectedClick() {
  displayingSelected = !displayingSelected;
  if (displayingSelected) {
    displaySelectedMeals();
    searchInput.disabled = true;
  } else {
    fetchMeals(searchInput.value.trim());
    searchInput.disabled = false;
  }
}

searchInput.addEventListener("input", (event) => {
  const inputValue = event.target.value.trim();
  fetchMeals(inputValue);
});

toggleSelectedButton.addEventListener("click", handleToggleSelectedClick);

document.addEventListener("click", (event) => {
  if (event.target.classList.contains("goBackButton")) {
    if (displayingSelected) {
      displaySelectedMeals();
    } else {
      fetchMeals(searchInput.value.trim());
    }
    searchInput.disabled = false;
  }
});

// Monitoring
setInterval(() => {
  console.log("API Calls:", apiCallCount);
  console.log("Stored Meals:", selectedMeals.length);
}, 30000);

// Initial load
fetchRandomMeals(15);
