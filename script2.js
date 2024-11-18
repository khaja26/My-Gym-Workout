// Show Button Logic
document.getElementById('showButton').addEventListener('click', () => {
    // Fetch saved data from the database
    const query = `
      SELECT date, day, activity, hours, minutes 
      FROM activities
      ORDER BY date ASC;
    `;
  
    const result = db.exec(query);
  
    if (result.length === 0) {
      alert('No data to show.');
      return;
    }
  
    // Populate the table with data
    const dataTableBody = document.querySelector('#dataTable tbody');
    dataTableBody.innerHTML = ''; // Clear existing rows
  
    const rows = result[0].values; // Extract rows from query result
    rows.forEach(row => {
      const tr = document.createElement('tr');
      row.forEach(cell => {
        const td = document.createElement('td');
        td.textContent = cell;
        tr.appendChild(td);
      });
      dataTableBody.appendChild(tr);
    });
  
    // Display the data table
    const dataDisplayDiv = document.getElementById('dataDisplay');
    dataDisplayDiv.classList.remove('hidden');
  });
  