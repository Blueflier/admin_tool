// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Target the container for the search results rows (tbody within #searchResultsTable)
    const resultsTable = document.querySelector('#searchResultsTable tbody');
  
    if (resultsTable) {
      // Add click event listener to the table rows
      resultsTable.addEventListener('click', (event) => {
        // Find the closest row (tr element)
        const row = event.target.closest('tr');
        if (!row) return;
  
        // Extract the required data from the row
        const time = getClassTime(row); // Full range, e.g., "Monday,Wednesday 10:30 AM - 01:20 PM"
        const subject = getSubject(row); // e.g., "ARTS"
        const title = getTitle(row); // e.g., "Art Appreciation"
        const professor = getProfessor(row); // e.g., "Dunham, Kari"
        const professorEmail = getProfessorEmail(row); // e.g., "kari.dunham@biola.edu"
        const buildingRoom = getBuildingRoom(row); // e.g., "Bardwell Hall 210"
  
        // Format the output as requested
        const output = `${time} ${subject} ${title} ${professor} ${professorEmail} ${buildingRoom}`;
  
        // Show an alert with the copied information
        alert('Copied information:\n\n' + output);
  
        // Copy to clipboard
        navigator.clipboard.writeText(output)
          .then(() => {
            // Optional: Provide user feedback after copying
            console.log('Copied to clipboard: ' + output);
          })
          .catch(err => {
            console.error('Failed to copy to clipboard:', err);
            alert('Failed to copy to clipboard. Please try again.');
          });
      });
    } else {
      console.error('Could not find #searchResultsTable tbody in the DOM.');
    }
  });
  
  // Helper functions to extract data from row elements
  function getClassTime(row) {
    // Find the second meeting div (class meeting) in the row
    const meetings = row.querySelectorAll('div.meeting');
    if (meetings.length < 2) return '';
  
    const meetingSchedule = meetings[1].querySelector('div.meeting-schedule');
    if (!meetingSchedule) return '';
  
    // Get the days (e.g., "Monday,Wednesday") from ui-pillbox-summary
    const days = meetingSchedule.querySelector('div.ui-pillbox-summary.screen-reader')?.textContent.trim() || '';
    
    // Get the time range (e.g., "10:30 AM - 01:20 PM") from the span
    const timeSpan = meetingSchedule.querySelector('span:nth-child(2)');
    const time = timeSpan ? timeSpan.textContent.trim() : '';
  
    return time ? `${days} ${time}` : '';
  }
  
  function getSubject(row) {
    const subjectCell = row.querySelector('td[data-property="subject"]');
    return subjectCell ? subjectCell.textContent.trim() : '';
  }
  
  function getTitle(row) {
    const titleLink = row.querySelector('a.section-details-link');
    return titleLink ? titleLink.textContent.trim() : '';
  }
  
  function getProfessor(row) {
    const instructorLink = row.querySelector('td[data-property="instructor"] a.email');
    return instructorLink ? instructorLink.textContent.trim().replace(' (Primary)', '') : '';
  }
  
  function getProfessorEmail(row) {
    const instructorLink = row.querySelector('td[data-property="instructor"] a.email');
    return instructorLink ? instructorLink.getAttribute('href').replace('mailto:', '').trim() : '';
  }
  
  function getBuildingRoom(row) {
    // Find the second meeting div (class meeting) in the row
    const meetings = row.querySelectorAll('div.meeting');
    if (meetings.length < 2) return '';
  
    const meetingSchedule = meetings[1].querySelector('div.meeting-schedule');
    if (!meetingSchedule) return '';
  
    // Get building and room from span.tooltip-row, excluding "Building:" and "Room:" prefixes
    const buildingSpan = meetingSchedule.querySelector('span.tooltip-row:nth-child(3)'); // Building (after Type)
    const roomSpan = meetingSchedule.querySelector('span.tooltip-row:nth-child(5)'); // Room (after Building)
  
    const building = buildingSpan ? buildingSpan.textContent.trim().replace('Building:', '').trim() : '';
    const room = roomSpan ? roomSpan.textContent.trim().replace('Room:', '').trim() : '';
  
    return building && room ? `${building} ${room}` : '';
  }