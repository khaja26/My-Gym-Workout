// Service Worker Registration
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/service-worker.js")
    .then(() => console.log("Service Worker Registered"))
    .catch((error) => console.log("Service Worker Registration Failed:", error));
}

let db;

// Initialize SQLite database
async function initDatabase() {
  const SQL = await initSqlJs({
    locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.wasm`,
  });

  const savedDB = localStorage.getItem('sqlite-db');
  if (savedDB) {
    db = new SQL.Database(new Uint8Array(JSON.parse(savedDB)));
    console.log("Database loaded from localStorage.");
  } else {
    db = new SQL.Database();
    db.run(`
      CREATE TABLE IF NOT EXISTS gtb (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        Date TEXT,
        Day TEXT,
        Activity TEXT,
        Hours INTEGER,
        Minutes INTEGER
      );
    `);
    console.log("New database and table created.");
  }

  displayData(); // Display existing data on initialization
}

// Save data to SQLite
function saveData({ date, day, activity, hours, minutes }) {
  const insertQuery = `
    INSERT INTO gtb (Date, Day, Activity, Hours, Minutes)
    VALUES (?, ?, ?, ?, ?);
  `;
  db.run(insertQuery, [date, day, activity, hours, minutes]);
  alert("Data saved successfully!");
  saveDatabase();
  displayData();
}

// Update data in SQLite
function updateData({ id, date, day, activity, hours, minutes }) {
  const updateQuery = `
    UPDATE gtb
    SET Date = ?, Day = ?, Activity = ?, Hours = ?, Minutes = ?
    WHERE id = ?;
  `;
  db.run(updateQuery, [date, day, activity, hours, minutes, id]);
  alert("Data updated successfully!");
  saveDatabase();
  displayData();
}

// Delete data from SQLite
function deleteData(id) {
  const deleteQuery = `DELETE FROM gtb WHERE id = ?;`;
  db.run(deleteQuery, [id]);
  alert("Data deleted successfully!");
  saveDatabase();
  displayData();
}

// Save the database to localStorage
function saveDatabase() {
  const data = db.export();
  const dataStr = JSON.stringify(Array.from(data));
  localStorage.setItem("sqlite-db", dataStr);
}

// Fetch and display data from SQLite
function displayData() {
  const selectQuery = `SELECT id, Date, Day, Activity, Hours, Minutes FROM gtb;`;
  const results = db.exec(selectQuery);

  const dataTableBody = document.querySelector("#dataTable tbody");
  dataTableBody.innerHTML = "";

  if (results.length > 0) {
    const rows = results[0].values;
    rows.forEach(row => {
      const tr = document.createElement("tr");
      tr.dataset.rowId = row[0]; // Primary key stored but not shown

      row.slice(1).forEach(cell => {
        const td = document.createElement("td");
        td.textContent = cell;
        tr.appendChild(td);
      });

      tr.addEventListener("click", () => activateRow(tr, row));
      dataTableBody.appendChild(tr);
    });
  }

  document.getElementById("dataDisplay").classList.remove("hidden");
}

// Highlight selected row
let selectedRowData = null;

function activateRow(rowElement, rowData) {
  document.querySelectorAll("#dataTable tbody tr").forEach(row => row.classList.remove("highlighted"));
  rowElement.classList.add("highlighted");
  selectedRowData = rowData;
}

// Reset form fields
function resetForm(formId, dayDisplayId) {
  document.getElementById(formId).reset();
  document.getElementById(dayDisplayId).textContent = "";
  selectedRowData = null;
}

// Hide popup
function hidePopup(popupId) {
  document.getElementById(popupId).classList.add("hidden");
}

// Show popup for Add or Edit Activity
function showPopup(popupId, isEdit = false) {
  if (isEdit && selectedRowData) {
    const [, date, day, activity, hours, minutes] = selectedRowData;
    document.getElementById("editActivityDate").value = date;
    document.getElementById("editDayDisplay").textContent = `Day: ${day}`;
    document.getElementById("editActivityText").value = activity;
    document.getElementById("editActivityHours").value = hours;
    document.getElementById("editActivityMinutes").value = minutes;
  } else if (!isEdit) {
    resetForm("addActivityForm", "addDayDisplay");
  } else {
    alert("Please select a row to edit.");
    return;
  }
  document.getElementById(popupId).classList.remove("hidden");
}

// Handle Add Form Submission
document.getElementById("addSubmitButton").addEventListener("click", () => {
  const date = document.getElementById("addActivityDate").value;
  const day = document.getElementById("addDayDisplay").textContent.replace("Day: ", "").trim();
  const activity = document.getElementById("addActivityText").value;
  const hours = parseInt(document.getElementById("addActivityHours").value, 10) || 0;
  const minutes = parseInt(document.getElementById("addActivityMinutes").value, 10) || 0;

  if (!date || !activity || (hours === 0 && minutes === 0)) {
    alert("Please fill in all required fields!");
    return;
  }

  saveData({ date, day, activity, hours, minutes });
  hidePopup("addActivityPopup");
});

// Handle Edit Form Submission
document.getElementById("editSubmitButton").addEventListener("click", () => {
  if (!selectedRowData) {
    alert("No activity selected for editing!");
    return;
  }

  const id = selectedRowData[0];
  const date = document.getElementById("editActivityDate").value;
  const day = document.getElementById("editDayDisplay").textContent.replace("Day: ", "").trim();
  const activity = document.getElementById("editActivityText").value;
  const hours = parseInt(document.getElementById("editActivityHours").value, 10) || 0;
  const minutes = parseInt(document.getElementById("editActivityMinutes").value, 10) || 0;

  if (!date || !activity || (hours === 0 && minutes === 0)) {
    alert("Please fill in all required fields!");
    return;
  }

  updateData({ id, date, day, activity, hours, minutes });
  hidePopup("editActivityPopup");
});

// Handle Delete Button Click
document.getElementById("deleteButton").addEventListener("click", () => {
  if (!selectedRowData) {
    alert("Please select a row to delete.");
    return;
  }

  if (confirm("Are you sure you want to delete this entry?")) {
    const id = selectedRowData[0];
    deleteData(id);
  }
});

// Event Listeners for Date Input Changes
document.querySelectorAll('[id$="ActivityDate"]').forEach(input => {
  input.addEventListener("change", (event) => {
    const date = new Date(event.target.value);
    const dayId = event.target.id.includes("add") ? "addDayDisplay" : "editDayDisplay";
    document.getElementById(dayId).textContent = `Day: ${date.toLocaleDateString("en-US", { weekday: "long" })}`;
  });
});

// Initialize database and event listeners
document.addEventListener("DOMContentLoaded", () => {
  initDatabase();

  document.getElementById("addButton").addEventListener("click", () => showPopup("addActivityPopup"));
  document.getElementById("editButton").addEventListener("click", () => showPopup("editActivityPopup", true));
  document.getElementById("addCancelButton").addEventListener("click", () => hidePopup("addActivityPopup"));
  document.getElementById("editCancelButton").addEventListener("click", () => hidePopup("editActivityPopup"));
});

function shareActivity(activityText) {
    if (navigator.share) {
        navigator.share({
            title: 'My Daily Activity',
            text: `Check out this activity: ${activityText}`,
            url: window.location.href // URL of the current page
        })
        .then(() => console.log('Share was successful.'))
        .catch((error) => console.log('Sharing failed:', error));
    } else {
        alert('Sharing is not supported in this browser.');
    }
}
