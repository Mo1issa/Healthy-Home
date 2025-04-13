const searchInput = document.getElementById("searchInput");
const mealDisplay = document.querySelector(".mealDisplay");
const toggleSelectedButton = document.querySelector(".toggleSelectedButton");

let mealsData = [];
let selectedMeals = JSON.parse(localStorage.getItem("selectedMeals")) || [];
let displayingSelected = false;

function toggleFavorite(button, meal) {
  const mealIndex = selectedMeals.findIndex(
    (item) => item.idMeal === meal.idMeal
  );
  if (mealIndex !== -1) {
    selectedMeals.splice(mealIndex, 1);
  } else {
    selectedMeals.push(meal);
  }
  const mealDataIndex = mealsData.findIndex(
    (item) => item.idMeal === meal.idMeal
  );
  if (mealDataIndex !== -1) {
    mealsData[mealDataIndex].selected = !mealsData[mealDataIndex].selected;
  }
  localStorage.setItem("selectedMeals", JSON.stringify(selectedMeals));
  if (displayingSelected) {
    displaySelectedMeals();
  } else {
    fetchMeals(searchInput.value.trim());
  }
}

function removeFromSelectedMeals(meal) {
  const mealIndex = selectedMeals.findIndex(
    (item) => item.idMeal === meal.idMeal
  );
  if (mealIndex !== -1) {
    selectedMeals.splice(mealIndex, 1);
    const mealDataIndex = mealsData.findIndex(
      (item) => item.idMeal === meal.idMeal
    );
    if (mealDataIndex !== -1) {
      mealsData[mealDataIndex].selected = false;
    }
    localStorage.setItem("selectedMeals", JSON.stringify(selectedMeals));
    displaySelectedMeals();
  }
}

function displaySelectedMeals() {
  const selectedMealHTML = selectedMeals
    .map(
      (meal) => `
        <div class="meal">
          <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
          <div class="wrapper">
            <h3>${
              meal.strMeal.length > 10
                ? meal.strMeal.slice(0, 10) + "..."
                : meal.strMeal
            }</h3>
            <button class="removeFromList selected"><i class="fa-solid fa-heart fav"></i></button>
            <button class="viewDetails"><i class="fa-solid fa-eye"></i></button>
          </div>
        </div>
      `
    )
    .join("");

  mealDisplay.innerHTML = selectedMealHTML;

  const removeFromListButtons = document.querySelectorAll(".removeFromList");
  removeFromListButtons.forEach((button, index) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const selectedMeal = selectedMeals[index];
      removeFromSelectedMeals(selectedMeal);
      console.log("Selected Meals:", selectedMeals);
    });
  });

  const viewDetailsButtons = document.querySelectorAll(".viewDetails");
  viewDetailsButtons.forEach((button, index) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const selectedMeal = selectedMeals[index];
      fetchMealDetails(selectedMeal.idMeal);
      searchInput.disabled = true;
    });
  });
}

function fetchMealDetails(mealId) {
  const apiUrl = `https://themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`;

  fetch(apiUrl)
    .then((response) => response.json())
    .then((data) => {
      if (data.meals === null) {
        console.error("Meal details not found.");
        return;
      }

      const mealDetails = data.meals[0];

      const mealDetailsHTML = `
        <div class="mealDetails">
          <img src="${mealDetails.strMealThumb}" alt="${mealDetails.strMeal}">
          <div class="detailsWrapper">
            <h2>${mealDetails.strMeal}</h2>
            <p><strong>Category:</strong> ${mealDetails.strCategory}</p>
            <p><strong>Area:</strong> ${mealDetails.strArea}</p>
            <p><strong>Tags:</strong> ${mealDetails.strTags}</p>
            <p><strong>Ingredients:</strong></p>
            <ul>
            ${getIngredientsList(mealDetails)}
            </ul>
            <p><strong>Instructions:</strong> ${mealDetails.strInstructions}</p>
            <p><strong>YouTube Link:</strong></p>
            <a href="${mealDetails.strYoutube}" target="_blank">${mealDetails.strYoutube}</a>
            <button class="goBackButton">Go Back</button>
          </div>
        </div>
      `;

      function getIngredientsList(mealDetails) {
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
          const ingredient = mealDetails[`strIngredient${i}`];
          const measure = mealDetails[`strMeasure${i}`];
          if (ingredient) {
            ingredients.push(
              `<li>${measure ? `${measure} ` : ""}${ingredient}</li>`
            );
          }
        }
        return ingredients.join("");
      }

      mealDisplay.innerHTML = mealDetailsHTML;
    })
    .catch((error) => {
      console.error("Error fetching meal details:", error);
      mealDisplay.innerHTML =
        "<p>Error fetching meal details. Please try again later.</p>";
    });
}

function fetchMeals(value) {
  if (value === "") {
    mealDisplay.innerHTML = "";
    return;
  }
  const apiUrl = `https://themealdb.com/api/json/v1/1/search.php?s=${value}`;

  fetch(apiUrl)
    .then((response) => response.json())
    .then((data) => {
      if (data.meals === null) {
        mealDisplay.innerHTML = "<h2>No meals found.</h2>";
      } else {
        mealsData = data.meals.map((meal) => ({
          ...meal,
          selected: selectedMeals.some(
            (selectedMeal) => selectedMeal.idMeal === meal.idMeal
          ),
        }));

        const mealHTML = mealsData
          .map(
            (meal) => `
              <div class="meal">
                <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
                <div class="wrapper">
                  <h3>${
                    meal.strMeal.length > 10
                      ? meal.strMeal.slice(0, 10) + "..."
                      : meal.strMeal
                  }</h3>
                  <button class="addToList ${
                    meal.selected ? "selected" : ""
                  }"><i class="fa-solid fa-heart fav"></i></button>
                  <button class="viewDetails"><i class="fa-solid fa-eye"></i></button>
                </div>
              </div>
            `
          )
          .join("");

        mealDisplay.innerHTML = mealHTML;

        const addToMealListButtons = document.querySelectorAll(".addToList");
        addToMealListButtons.forEach((button, index) => {
          button.addEventListener("click", () => {
            const selectedMeal = mealsData[index];
            toggleFavorite(button, selectedMeal);
            console.log("Selected Meals:", selectedMeals);
          });
        });

        const viewDetailsButtons = document.querySelectorAll(".viewDetails");
        viewDetailsButtons.forEach((button, index) => {
          button.addEventListener("click", (event) => {
            event.stopPropagation();
            const selectedMeal = mealsData[index];
            fetchMealDetails(selectedMeal.idMeal);
            searchInput.disabled = true;
          });
        });
      }
    })
    .catch((error) => {
      console.error("Error fetching meals:", error);
      mealDisplay.innerHTML =
        "<p>Error fetching meals. Please try again later.</p>";
    });
}

function fetchRandomMeals(count = 10) {
  mealDisplay.innerHTML = "<p>Loading  meals...</p>";
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
        </div>
      `).join("");

      mealDisplay.innerHTML = mealHTML;

      document.querySelectorAll(".addToList").forEach((button, index) => {
        button.addEventListener("click", () => toggleFavorite(button, mealsData[index]));
      });

      document.querySelectorAll(".viewDetails").forEach((button, index) => {
        button.addEventListener("click", () => fetchMealDetails(mealsData[index].idMeal));
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
    fetchMeals(searchInput.value.trim());
    searchInput.disabled = false;
  }
});

// Fetch 10 random meals by default
fetchRandomMeals(15);