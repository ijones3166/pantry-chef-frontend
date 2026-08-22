export const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });

export const resizeImage = (file, maxWidth = 600) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = document.createElement("img");
      img.src = event.target.result;
      img.onload = () => {
        const elem = document.createElement("canvas");
        const scaleFactor = maxWidth / img.width;
        elem.width = maxWidth;
        elem.height = img.height * scaleFactor;
        const ctx = elem.getContext("2d");
        ctx.drawImage(img, 0, 0, elem.width, elem.height);
        resolve(elem.toDataURL("image/jpeg", 0.7));
      };
    };
  });
};

export const getTimestampInDays = (days) => {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
};

export const parsePrepTime = (prepTimeString) => {
  if (!prepTimeString) return 30;
  const numbers = prepTimeString.match(/\d+/g);
  if (!numbers) return 30;
  const hasHours = /h(ou)?r/i.test(prepTimeString);
  if (hasHours && numbers.length > 1) {
    return parseInt(numbers[0]) * 60 + parseInt(numbers[1]);
  } else if (hasHours) {
    return parseInt(numbers[0]) * 60;
  } else {
    return parseInt(numbers[0]);
  }
};

export const generateICS = (mealPlan) => {
  if (!mealPlan || mealPlan.length === 0) return;
  let icsContent =
    "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Pantry Chef//Meal Plan//EN\n";
  mealPlan.forEach((meal) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const now = new Date();
    const currentDayIndex = now.getDay();
    const targetDayIndex = days.indexOf(meal.day);
    let daysToAdd = targetDayIndex - currentDayIndex;
    if (daysToAdd < 0) daysToAdd += 7;
    if (
      daysToAdd === 0 &&
      meal.mealTime &&
      parseInt(meal.mealTime.split(":")[0]) < now.getHours()
    )
      daysToAdd += 7;
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + daysToAdd);
    const [hours, mins] = (meal.mealTime || "18:00").split(":").map(Number);
    targetDate.setHours(hours, mins, 0);
    const prepMinutes = parsePrepTime(meal.prepTime);
    const startDate = new Date(targetDate);
    startDate.setMinutes(targetDate.getMinutes() - prepMinutes);
    const formatICSDate = (d) =>
      d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    icsContent += "BEGIN:VEVENT\n";
    icsContent += `DTSTART:${formatICSDate(startDate)}\n`;
    icsContent += `DTEND:${formatICSDate(targetDate)}\n`;
    icsContent += `SUMMARY:COOK: ${meal.recipeTitle}\n`;
    icsContent += `DESCRIPTION:Time to start cooking ${meal.recipeTitle}! Prep time is approx ${prepMinutes} mins.\n`;
    icsContent += "END:VEVENT\n";
  });
  icsContent += "END:VCALENDAR";
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute("download", "meal_plan.ics");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};