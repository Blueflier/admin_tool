// Console logging prefix for easy filtering
const LOG_PREFIX = 'BIOLA EXTRACTOR:';
console.log(`${LOG_PREFIX} Script loaded - initial execution`);

// Wait for table to be fully initialized before applying styles
function waitForTableInitialization() {
  console.log(`${LOG_PREFIX} Waiting for table to be fully initialized`);
  return new Promise(resolve => {
    // Function to check if table is properly initialized
    const checkTable = () => {
      const table = document.querySelector('#searchResultsTable table');
      // Check for more complete initialization criteria
      if (table && 
          table.classList.contains('draggable') && 
          table.classList.contains('footable-loaded') &&
          table.querySelector('th .ui-icon')) { // Check for filter/sort icons
        console.log(`${LOG_PREFIX} Table is initialized with proper classes and UI elements`);
        resolve(table);
        return true;
      }
      return false;
    };

    // Try immediately
    if (checkTable()) return;

    // Set up an observer to watch for table changes
    const observer = new MutationObserver((mutations, obs) => {
      if (checkTable()) {
        obs.disconnect();
      }
    });

    // Start observing the document with configured parameters
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });

    // Fallback timeout after 10 seconds
    setTimeout(() => {
      observer.disconnect();
      console.log(`${LOG_PREFIX} Fallback timeout for table initialization`);
      resolve(document.querySelector('#searchResultsTable table'));
    }, 10000);
  });
}

// Function to add styles to fix table overflow - respecting native functionality
function addOverflowStyles() {
  console.log(`${LOG_PREFIX} Adding overflow fixes to table`);
  
  // Remove any existing style element to prevent duplication
  const existingStyle = document.getElementById('biola-extractor-styles');
  if (existingStyle) {
    existingStyle.remove();
  }
  
  // Create a style element
  const styleEl = document.createElement('style');
  styleEl.id = 'biola-extractor-styles';
  
  // Add CSS rules that are compatible with draggable tables
  styleEl.textContent = `
    /* Only control overflow for content cells, but don't force width */
    #searchResultsTable table.footable td {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    /* Make sure column headers have proper spacing and don't get squished */
    #searchResultsTable table.footable th {
      position: relative;
      padding-right: 20px; /* Make room for the filter/organize button */
      min-width: 80px; /* Ensure minimum width for headers */
      overflow: hidden !important; /* Force hidden overflow on th element */
    }
    
    /* Absolutely force single-line text in all header titles */
    #searchResultsTable table.footable th .title {
      display: inline-block !important;
      overflow: hidden !important;
      white-space: nowrap !important;
      text-overflow: ellipsis !important;
      max-width: 100% !important;
      width: calc(100% - 20px) !important; /* Account for filter icons */
      word-wrap: normal !important;
      word-break: normal !important;
    }
    
    /* Preserve width for our sort/filter icons */
    #searchResultsTable table.footable th .ui-icon {
      position: absolute;
      right: 4px;
      top: 50%;
      margin-top: -8px;
    }
    
    /* Column resize handle styling */
    #searchResultsTable table.footable th .resize-handle {
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: 5px;
      background: transparent;
      cursor: col-resize;
      z-index: 10;
    }
    
    /* Visual indicator on hover */
    #searchResultsTable table.footable th .resize-handle:hover,
    #searchResultsTable table.footable th .resize-handle.active {
      background: rgba(0, 123, 255, 0.3);
    }
    
    /* Special styling for copy button cell */
    #searchResultsTable table.footable .copy-button-cell {
      width: 40px;
      min-width: 40px;
      max-width: 40px;
      padding: 2px;
      overflow: visible;
      text-align: center;
    }
    
    /* Header styling - specific for our custom header */
    #searchResultsTable table.footable .copy-button-header {
      width: 40px;
      min-width: 40px;
      max-width: 40px;
      overflow: visible;
      text-align: center;
      padding-right: 4px; /* Reset padding for our custom header */
    }
    
    /* Button styling */
    #searchResultsTable table.footable .copy-button {
      padding: 2px 0;
      margin: 0;
      width: 36px;
      font-size: 11px;
      height: 20px;
    }
    
    /* Allow table to calculate proper column widths */
    #searchResultsTable table.footable {
      table-layout: auto; /* Let browser calculate column widths based on content */
    }
  `;
  
  // Add the style to the document
  document.head.appendChild(styleEl);
  console.log(`${LOG_PREFIX} Added overflow fix styles`);
}

// Function to ensure proper column widths based on both headers and data content
function adjustColumnWidths() {
  const table = document.querySelector('#searchResultsTable table');
  if (!table) return;
  
  // Check if we've already run a width calculation (to prevent continuous growth)
  if (table.hasAttribute('data-width-adjusted')) {
    // If we've already adjusted widths once, only restore classes and exit
    ensureTableClasses(table);
    return;
  }
  
  console.log(`${LOG_PREFIX} Adjusting column widths based on headers and content`);
  
  // Get all headers except our copy button header
  const headers = Array.from(table.querySelectorAll('th')).filter(
    th => !th.classList.contains('copy-button-header')
  );
  
  // Process each column
  headers.forEach(header => {
    // Get the content width needed for the header text + icon
    const headerContent = header.querySelector('.title');
    if (!headerContent) return;
    
    // Get index of this header in its row
    const headerIndex = Array.from(header.parentNode.children).indexOf(header);
    
    // Find all cells in this column (using nth-child to match column index)
    // We add 1 because CSS nth-child is 1-indexed
    const columnCells = table.querySelectorAll(`tbody tr td:nth-child(${headerIndex + 1})`);
    
    // Get natural width of header content
    const headerWidth = headerContent.scrollWidth + 25; // Add padding for sort icon
    
    // Find the maximum content width in this column's cells
    let maxCellWidth = 0;
    columnCells.forEach(cell => {
      const cellWidth = cell.scrollWidth;
      if (cellWidth > maxCellWidth) {
        maxCellWidth = cellWidth;
      }
    });
    
    // Use the larger of the header or cell content width as the minimum
    const minWidth = Math.max(headerWidth, maxCellWidth, 80);
    
    // Apply the width to the header and adjust for draggability
    header.style.minWidth = `${minWidth}px`;
  });
  
  // Mark the table as having had its widths adjusted
  table.setAttribute('data-width-adjusted', 'true');
  
  // Ensure all required classes are present
  ensureTableClasses(table);
  
  console.log(`${LOG_PREFIX} Column width adjustment complete`);
}

// Function to ensure all required table classes are present
function ensureTableClasses(table) {
  if (!table) return;
  
  // List of classes that must be present on the table
  const requiredClasses = ['draggable', 'resizable', 'KeyTable'];
  
  // Check and add any missing classes
  requiredClasses.forEach(className => {
    if (!table.classList.contains(className)) {
      console.log(`${LOG_PREFIX} Table missing ${className} class, restoring it`);
      table.classList.add(className);
    }
  });
}

// Function to add resize handles to column headers
function addResizeHandlesToHeaders() {
  console.log(`${LOG_PREFIX} Adding resize handles to column headers`);
  const table = document.querySelector('#searchResultsTable table');
  if (!table) return;
  
  // Get all headers except our copy button header
  const headers = Array.from(table.querySelectorAll('th')).filter(
    th => !th.classList.contains('copy-button-header')
  );
  
  // Process each header to add resize handle
  headers.forEach(header => {
    // Skip if already has a resize handle
    if (header.querySelector('.resize-handle')) {
      return;
    }
    
    // Create resize handle element
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    resizeHandle.title = 'Click and drag to resize column';
    
    // Add the resize handle to the header
    header.appendChild(resizeHandle);
    
    // Add event listeners for resize functionality
    let startX, startWidth, currentHeader;
    
    resizeHandle.addEventListener('mousedown', function(e) {
      // Prevent default selection behavior
      e.preventDefault();
      
      // Mark as active
      this.classList.add('active');
      
      // Get starting position and width
      startX = e.pageX;
      currentHeader = this.parentElement;
      startWidth = currentHeader.offsetWidth;
      
      // Add document-level event listeners for drag operation
      document.addEventListener('mousemove', resizeColumn);
      document.addEventListener('mouseup', stopResize);
      
      // Ensure table has needed classes
      ensureTableClasses(table);
      
      // Add a class to body to indicate resizing is in progress
      document.body.classList.add('column-resizing');
    });
    
    function resizeColumn(e) {
      if (!currentHeader) return;
      
      // Calculate new width
      const diffX = e.pageX - startX;
      const newWidth = Math.max(80, startWidth + diffX);
      
      // Apply the new width to the column header
      currentHeader.style.width = newWidth + 'px';
      currentHeader.style.minWidth = newWidth + 'px';
      
      // Update title width to match the header width
      const titleElem = currentHeader.querySelector('.title');
      if (titleElem) {
        // Set title width accounting for padding and icons
        titleElem.style.width = 'calc(100% - 20px)';
        titleElem.style.maxWidth = 'calc(100% - 20px)';
        
        // Enforce single-line text
        titleElem.style.whiteSpace = 'nowrap';
        titleElem.style.overflow = 'hidden';
        titleElem.style.textOverflow = 'ellipsis';
      }
      
      // Force browser to recalculate layout for the resized column
      setTimeout(() => {
        if (titleElem) {
          // Trigger a reflow to ensure text truncation is recalculated
          titleElem.style.display = 'inline-block';
          void titleElem.offsetHeight; // Force reflow
          titleElem.style.display = ''; // Reset display
        }
      }, 0);
    }
    
    function stopResize() {
      // Clean up event listeners
      document.removeEventListener('mousemove', resizeColumn);
      document.removeEventListener('mouseup', stopResize);
      
      // Remove active class
      const activeHandles = document.querySelectorAll('.resize-handle.active');
      activeHandles.forEach(handle => handle.classList.remove('active'));
      
      // Remove body class
      document.body.classList.remove('column-resizing');
      
      // Reset reference
      currentHeader = null;
    }
  });
  
  console.log(`${LOG_PREFIX} Finished adding resize handles to headers`);
}

// Function to save column preferences
function saveColumnPreferences() {
  console.log(`${LOG_PREFIX} Saving column preferences`);
  const table = document.querySelector('#searchResultsTable table');
  if (!table) return false;
  
  const headers = Array.from(table.querySelectorAll('th')).filter(
    th => !th.classList.contains('copy-button-header')
  );
  
  // DEBUGGING: Check for CRN before saving
  const headerNames = headers.map(h => {
    const titleElement = h.querySelector('.title');
    return titleElement ? titleElement.textContent.trim() : 'unknown';
  });
  
  console.log(`${LOG_PREFIX} DEBUG: Headers before saving:`, headerNames);
  console.log(`${LOG_PREFIX} DEBUG: CRN present: ${headerNames.includes('CRN')}`);
  
  // If CRN is not in the headers but should be, we need to check if it's hidden
  if (!headerNames.includes('CRN')) {
    console.log(`${LOG_PREFIX} WARNING: CRN column not found when saving preferences!`);
    
    // Check if there are any hidden headers that might contain CRN
    const allHeaders = Array.from(table.querySelectorAll('thead th'));
    
    // Look for possibly hidden CRN header
    for (const header of allHeaders) {
      const title = header.querySelector('.title');
      if (title && title.textContent.trim() === 'CRN') {
        console.log(`${LOG_PREFIX} FIX: Found CRN header that was filtered out, will include it`);
        headers.push(header);
        break;
      }
    }
  }
  
  // Create an array of column preferences
  const columnPrefs = headers.map((header, index) => {
    // Get the column ID or name
    const titleElement = header.querySelector('.title');
    const columnName = titleElement ? titleElement.textContent.trim() : `Column ${index}`;
    
    // Get current position (index in DOM)
    const currentPosition = Array.from(header.parentNode.children).indexOf(header);
    
    // Get width (either from style or computed)
    const width = header.style.width || 
                  header.style.minWidth || 
                  getComputedStyle(header).width;
    
    // DEBUGGING: Log CRN specific info
    if (columnName === 'CRN') {
      console.log(`${LOG_PREFIX} DEBUG: Saving CRN column - position: ${currentPosition}, width: ${width}`);
    }
    
    return {
      name: columnName,
      originalIndex: index,
      currentPosition: currentPosition,
      width: width
    };
  });
  
  // Special handling for CRN - ensure it exists in preferences with a good position
  const hasCRN = columnPrefs.some(pref => pref.name === 'CRN');
  if (!hasCRN) {
    console.log(`${LOG_PREFIX} FIX: Adding missing CRN column to preferences`);
    columnPrefs.push({
      name: 'CRN',
      originalIndex: columnPrefs.length,
      currentPosition: 0, // First position
      width: '100px'
    });
  }
  
  // Check if Chrome storage API is available
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    // Save to Chrome storage
    chrome.storage.local.set({ 'biolaColumnPreferences': columnPrefs }, function() {
      console.log(`${LOG_PREFIX} Saved column preferences to Chrome storage:`, columnPrefs);
    });
  } else {
    // Fallback to localStorage
    try {
      localStorage.setItem('biolaColumnPreferences', JSON.stringify(columnPrefs));
      console.log(`${LOG_PREFIX} Saved column preferences to localStorage:`, columnPrefs);
    } catch (error) {
      console.error(`${LOG_PREFIX} Error saving to localStorage:`, error);
    }
  }
  
  return true;
}

// Function to load column preferences
function loadColumnPreferences() {
  console.log(`${LOG_PREFIX} Loading column preferences`);
  
  // Return a promise for async loading
  return new Promise((resolve) => {
    // Check if Chrome storage API is available
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      // Load from Chrome storage
      chrome.storage.local.get('biolaColumnPreferences', function(result) {
        if (chrome.runtime.lastError) {
          console.error(`${LOG_PREFIX} Error loading column preferences:`, chrome.runtime.lastError);
          resolve(null);
          return;
        }
        
        const prefs = result.biolaColumnPreferences;
        if (!prefs) {
          console.log(`${LOG_PREFIX} No saved column preferences found in Chrome storage`);
          resolve(null);
          return;
        }
        
        console.log(`${LOG_PREFIX} Loaded column preferences from Chrome storage:`, prefs);
        resolve(prefs);
      });
    } else {
      // Fallback to localStorage
      try {
        const prefsStr = localStorage.getItem('biolaColumnPreferences');
        if (!prefsStr) {
          console.log(`${LOG_PREFIX} No saved column preferences found in localStorage`);
          resolve(null);
          return;
        }
        
        const prefs = JSON.parse(prefsStr);
        console.log(`${LOG_PREFIX} Loaded column preferences from localStorage:`, prefs);
        resolve(prefs);
      } catch (error) {
        console.error(`${LOG_PREFIX} Error loading from localStorage:`, error);
        resolve(null);
      }
    }
  });
}

// Function to apply column preferences (reorder and resize)
async function applyColumnPreferences() {
  console.log(`${LOG_PREFIX} Applying column preferences`);
  const table = document.querySelector('#searchResultsTable table');
  if (!table) {
    console.log(`${LOG_PREFIX} Table not found, cannot apply preferences`);
    return false;
  }
  
  // Load saved preferences
  const prefs = await loadColumnPreferences();
  if (!prefs || !prefs.length) {
    console.log(`${LOG_PREFIX} No preferences to apply`);
    return false;
  }
  
  // Get header row and body rows
  const headerRow = table.querySelector('thead tr');
  const bodyRows = Array.from(table.querySelectorAll('tbody tr'));
  if (!headerRow || !bodyRows.length) {
    console.log(`${LOG_PREFIX} Header row or body rows not found`);
    return false;
  }
  
  // DEBUGGING: Log all current headers to check for CRN
  const allHeaders = Array.from(headerRow.querySelectorAll('th'));
  console.log(`${LOG_PREFIX} DEBUG: Current headers before applying preferences:`, 
    allHeaders.map(h => {
      const title = h.querySelector('.title');
      return title ? title.textContent.trim() : 'unknown';
    })
  );
  
  // Apply column widths first (easier part)
  const headerCells = Array.from(headerRow.querySelectorAll('th')).filter(
    th => !th.classList.contains('copy-button-header')
  );
  
  // Get current header names
  const currentHeaderNames = headerCells.map(h => {
    const title = h.querySelector('.title');
    return title ? title.textContent.trim() : 'unknown';
  });
  
  // Get preference names
  const prefNames = prefs.map(p => p.name);
  
  // Check for CRN column specifically
  const hasCRNInHeaders = currentHeaderNames.includes('CRN');
  const hasCRNInPrefs = prefNames.includes('CRN');
  
  // FIX: If we have CRN in current headers but not in preferences, add it to our preferences
  if (hasCRNInHeaders && !hasCRNInPrefs) {
    console.log(`${LOG_PREFIX} FIX: CRN found in headers but not in preferences, adding it`);
    
    // Find CRN index in current headers
    const crnIndex = currentHeaderNames.findIndex(name => name === 'CRN');
    
    // Add CRN to preferences with position 0 (first column)
    prefs.push({
      name: 'CRN',
      originalIndex: crnIndex,
      currentPosition: 0, // Force it to first position
      width: '100px' // Default reasonable width
    });
    
    // Resort preferences by original index to maintain correct mapping
    prefs.sort((a, b) => a.originalIndex - b.originalIndex);
    
    console.log(`${LOG_PREFIX} FIX: Updated preferences with CRN column:`, prefs);
  }
  
  if (headerCells.length !== prefs.length) {
    console.log(`${LOG_PREFIX} Header count mismatch: ${headerCells.length} vs ${prefs.length} preferences`);
    
    // DEBUGGING: Check what headers we have vs what's in preferences
    console.log(`${LOG_PREFIX} DEBUG: Current headers: `, currentHeaderNames);
    console.log(`${LOG_PREFIX} DEBUG: Preference headers: `, prefNames);
    
    // Look specifically for CRN in both sets
    console.log(`${LOG_PREFIX} DEBUG: CRN in current headers: `, currentHeaderNames.includes('CRN'));
    console.log(`${LOG_PREFIX} DEBUG: CRN in preferences: `, prefNames.includes('CRN'));
    
    // FIX: We'll continue with best effort instead of returning false
    console.log(`${LOG_PREFIX} Continuing with best effort despite header count mismatch`);
  }
  
  // First apply column widths to existing headers
  headerCells.forEach((header, index) => {
    // Find matching preference by header name instead of index for better reliability
    const titleElem = header.querySelector('.title');
    const headerName = titleElem ? titleElem.textContent.trim() : `Column ${index}`;
    
    // Find preference by name first, fall back to index if needed
    const pref = prefs.find(p => p.name === headerName) || 
                 prefs.find(p => p.originalIndex === index);
    
    if (pref && pref.width) {
      header.style.width = pref.width;
      header.style.minWidth = pref.width;
      
      // Also update the title element width to ensure proper text display
      if (titleElem) {
        titleElem.style.width = 'calc(100% - 20px)';
        titleElem.style.maxWidth = 'calc(100% - 20px)';
      }
    }
  });
  
  // Create improved reordering map that matches by column name when possible
  const reorderMap = [];
  
  headerCells.forEach((header, currentIndex) => {
    const titleElem = header.querySelector('.title');
    const headerName = titleElem ? titleElem.textContent.trim() : `Column ${currentIndex}`;
    
    // Find matching preference
    const pref = prefs.find(p => p.name === headerName);
    if (pref && pref.currentPosition !== currentIndex) {
      reorderMap.push({
        fromIndex: currentIndex,
        toIndex: pref.currentPosition,
        name: headerName
      });
    }
  });
  
  // Sort reorder operations by priority - put CRN first if present
  reorderMap.sort((a, b) => {
    // Always move CRN first
    if (a.name === 'CRN') return -1;
    if (b.name === 'CRN') return 1;
    
    // Otherwise sort by from index to avoid conflicts
    return a.fromIndex - b.fromIndex;
  });
  
  console.log(`${LOG_PREFIX} FIX: Using improved reorder map:`, reorderMap);
  
  // DEBUGGING: Check if CRN is being reordered
  const crnIndex = currentHeaderNames.findIndex(name => name === 'CRN');
  console.log(`${LOG_PREFIX} DEBUG: CRN column index before reordering: ${crnIndex}`);
  
  if (crnIndex !== -1) {
    const crnReorderInfo = reorderMap.find(map => map.name === 'CRN');
    console.log(`${LOG_PREFIX} DEBUG: CRN reorder info:`, crnReorderInfo);
  }
  
  // Only proceed if we have columns to reorder
  if (reorderMap.length > 0) {
    console.log(`${LOG_PREFIX} Reordering ${reorderMap.length} columns`);
    
    try {
      // Process each mapping
      for (const map of reorderMap) {
        // Get the header to move (need to recalculate every time as DOM changes)
        const currentHeaders = Array.from(headerRow.querySelectorAll('th')).filter(
          th => !th.classList.contains('copy-button-header')
        );
        
        // Find header by name
        const headerToMove = currentHeaders.find(h => {
          const title = h.querySelector('.title');
          return title && title.textContent.trim() === map.name;
        });
        
        if (!headerToMove) {
          console.log(`${LOG_PREFIX} Could not find header for ${map.name}, skipping`);
          continue;
        }
        
        // Get current index
        const currentIndex = Array.from(headerToMove.parentNode.children).indexOf(headerToMove);
        
        // Get target position
        let targetIndex = map.toIndex;
        
        // Handle special case for CRN - always move to first position
        if (map.name === 'CRN') {
          targetIndex = 0;
          // If we have a copy button header, we need the second position
          const hasCopyHeader = headerRow.querySelector('.copy-button-header');
          if (hasCopyHeader) {
            targetIndex = 1;
          }
        }
        
        console.log(`${LOG_PREFIX} Moving ${map.name} from position ${currentIndex} to ${targetIndex}`);
        
        // If we're already at the target position, skip
        if (currentIndex === targetIndex) {
          console.log(`${LOG_PREFIX} ${map.name} already at target position, skipping`);
          continue;
        }
        
        // Get reference node to insert before
        const allChildren = Array.from(headerRow.children);
        const referenceNode = allChildren[targetIndex];
        
        if (!referenceNode) {
          console.log(`${LOG_PREFIX} Could not find reference node for position ${targetIndex}`);
          continue;
        }
        
        // Move the header
        headerRow.insertBefore(headerToMove, referenceNode);
        
        // Move corresponding cells in each body row
        bodyRows.forEach(row => {
          const cells = Array.from(row.querySelectorAll('td'));
          
          // Get cell at current index (same as header index)
          const cellToMove = cells[currentIndex];
          if (!cellToMove) {
            console.log(`${LOG_PREFIX} Could not find cell at index ${currentIndex}`);
            return;
          }
          
          // Get reference cell
          const refCell = cells[targetIndex];
          if (!refCell) {
            console.log(`${LOG_PREFIX} Could not find reference cell at index ${targetIndex}`);
            return;
          }
          
          // Move the cell
          row.insertBefore(cellToMove, refCell);
        });
      }
      
      console.log(`${LOG_PREFIX} Column reordering complete`);
      
      // DEBUGGING: Log headers after reordering
      const finalHeaders = Array.from(headerRow.querySelectorAll('th'));
      console.log(`${LOG_PREFIX} DEBUG: Headers after reordering:`, 
        finalHeaders.map(h => {
          const title = h.querySelector('.title');
          return title ? title.textContent.trim() : 'unknown';
        })
      );
      
      return true;
    } catch (error) {
      console.error(`${LOG_PREFIX} Error reordering columns:`, error);
      return false;
    }
  } else {
    console.log(`${LOG_PREFIX} No column reordering needed`);
    return true;
  }
}

// Add option to automatically apply column preferences on load
// Set to true to enable auto-application of preferences
const AUTO_APPLY_PREFERENCES = true;

// Add a message listener to handle requests from the popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log(`${LOG_PREFIX} Received message from popup:`, request);
  
  // Check if we're on the right page
  if (request.action === "checkPage") {
    sendResponse({success: true, message: "On valid page"});
    return true;
  }
  
  // Handle save layout request
  if (request.action === "saveLayout") {
    const success = saveColumnPreferences();
    sendResponse({success: success, message: success ? "Layout saved" : "Failed to save layout"});
    return true;
  }
  
  // Handle reset layout request
  if (request.action === "resetLayout") {
    try {
      // Clear stored preferences
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.remove('biolaColumnPreferences', function() {
          console.log(`${LOG_PREFIX} Preferences reset from Chrome storage`);
          // Reload the page to reset the layout
          location.reload();
        });
      } else {
        localStorage.removeItem('biolaColumnPreferences');
        console.log(`${LOG_PREFIX} Preferences reset from localStorage`);
        // Reload the page to reset the layout
        location.reload();
      }
      sendResponse({success: true, message: "Layout reset"});
    } catch (error) {
      console.error(`${LOG_PREFIX} Error resetting layout:`, error);
      sendResponse({success: false, message: "Error resetting layout"});
    }
    return true;
  }
  
  // Return true to indicate we'll send a response asynchronously
  return true;
});

// Function to ensure title elements adapt to their header width properly
function fixTitleElementWidths() {
  console.log(`${LOG_PREFIX} Fixing title element widths`);
  const table = document.querySelector('#searchResultsTable table');
  if (!table) return;
  
  // Get all headers except our copy button header
  const headers = Array.from(table.querySelectorAll('th')).filter(
    th => !th.classList.contains('copy-button-header')
  );
  
  // Process each header to fix title width
  headers.forEach(header => {
    const titleElem = header.querySelector('.title');
    if (titleElem) {
      // Ensure header has proper overflow handling
      header.style.overflow = 'hidden';
      
      // Set proper width to ensure text respects column width
      titleElem.style.width = 'calc(100% - 20px)';
      titleElem.style.maxWidth = 'calc(100% - 20px)';
      
      // Force display mode for more reliable sizing
      titleElem.style.display = 'inline-block';
      
      // Force all headers to single line with overflow handling - extra important flags
      titleElem.style.whiteSpace = 'nowrap !important';
      titleElem.style.overflow = 'hidden !important';
      titleElem.style.textOverflow = 'ellipsis !important';
      
      // Prevent any word breaking that might cause wrapping
      titleElem.style.wordWrap = 'normal !important';
      titleElem.style.wordBreak = 'normal !important';
      
      // Check if this is the Linked Sections column
      const titleText = titleElem.textContent.trim();
      
      // Special width restrictions for specific headers
      if (titleText === 'Linked Sections') {
        header.style.width = '120px';
        header.style.maxWidth = '120px';
      }
      else if (titleText === 'Campus') {
        // Ensure Campus header is wide enough for "Campus" text
        header.style.width = '100px';
        header.style.minWidth = '100px';
      }
      else if (titleText === 'Instructional Methods') {
        // Ensure Instructional Methods has enough width
        header.style.width = '150px';
        header.style.minWidth = '150px';
      }
      
      // Force a reflow to ensure text truncation is properly calculated
      void titleElem.offsetHeight;
    }
  });
  
  console.log(`${LOG_PREFIX} Fixed title element widths`);
}

// Modify setupTableLayout to handle preferences without presets
async function setupTableLayout() {
  console.log(`${LOG_PREFIX} Setting up proper table layout`);
  
  // Wait for table initialization first
  await waitForTableInitialization();
  
  // DEBUGGING: Check for CRN column after table initialization
  const table = document.querySelector('#searchResultsTable table');
  const headers = table ? Array.from(table.querySelectorAll('thead th')) : [];
  
  console.log(`${LOG_PREFIX} DEBUG: Headers after table initialization:`, 
    headers.map(h => {
      const title = h.querySelector('.title');
      return title ? title.textContent.trim() : 'unknown';
    })
  );
  
  // Apply styles after table is initialized
  console.log(`${LOG_PREFIX} Table initialized, now applying styles and adjusting widths`);
  addOverflowStyles();
  
  // Fix title element widths right away to prevent vertical text
  fixTitleElementWidths();
  
  // Fix the Linked Sections column specifically
  fixLinkedSectionsColumn();
  
  // Give the browser a moment to apply initial styles, then adjust widths and add resize handles
  setTimeout(async () => {
    // Check if we have saved preferences
    if (AUTO_APPLY_PREFERENCES) {
      const prefs = await loadColumnPreferences();
      if (prefs && prefs.length) {
        // DEBUGGING: Check for CRN in loaded preferences
        const hasCRN = prefs.some(p => p.name === 'CRN');
        console.log(`${LOG_PREFIX} DEBUG: CRN found in loaded preferences: ${hasCRN}`);
        if (hasCRN) {
          const crnPref = prefs.find(p => p.name === 'CRN');
          console.log(`${LOG_PREFIX} DEBUG: CRN preference:`, crnPref);
        }
        
        // Use saved user preferences
        await applyColumnPreferences();
      } else {
        // Fall back to default width adjustment
    adjustColumnWidths();
      }
    } else {
      // Fall back to default width adjustment
      adjustColumnWidths();
    }
    
    addResizeHandlesToHeaders();
    
    // Apply fixed styling to Linked Sections again after preferences are applied
    fixLinkedSectionsColumn();
    
    // DEBUGGING: Check for CRN column after applying preferences
    const tableAfter = document.querySelector('#searchResultsTable table');
    const headersAfter = tableAfter ? Array.from(tableAfter.querySelectorAll('thead th')) : [];
    
    console.log(`${LOG_PREFIX} DEBUG: Headers after applying preferences:`, 
      headersAfter.map(h => {
        const title = h.querySelector('.title');
        return title ? title.textContent.trim() : 'unknown';
      })
    );
    
    // Add event listener to save preferences when columns are reordered
    const table = document.querySelector('#searchResultsTable table');
    if (table) {
      // Using a MutationObserver to detect when columns are reordered
      const observer = new MutationObserver((mutations) => {
        // Debounce the save operation to avoid excessive calls during drag
        clearTimeout(table.saveTimeout);
        table.saveTimeout = setTimeout(() => {
          // We no longer auto-save on reordering, as it's now done through the popup menu
          
          // Reapply Linked Sections fix after column reordering
          fixLinkedSectionsColumn();
          
          // DEBUGGING: Check headers after mutation
          const headersAfterMutation = table.querySelectorAll('thead th');
          console.log(`${LOG_PREFIX} DEBUG: Headers after table mutation:`, 
            Array.from(headersAfterMutation).map(h => {
              const title = h.querySelector('.title');
              return title ? title.textContent.trim() : 'unknown';
            })
          );
        }, 1000);
      });
      
      // Observe changes to table header row
      const headerRow = table.querySelector('thead tr');
      if (headerRow) {
        observer.observe(headerRow, { 
          childList: true,  // Watch for column reordering
          subtree: false
        });
      }
    }
  }, 500);
  
  // Then periodically check that the required classes are maintained
  setInterval(() => {
    const table = document.querySelector('#searchResultsTable table');
    if (table) {
      ensureTableClasses(table);
      
      // Check if resize handles need to be re-added (for dynamically updated content)
      const headers = Array.from(table.querySelectorAll('th')).filter(
        th => !th.classList.contains('copy-button-header')
      );
      
      const missingHandles = headers.some(header => !header.querySelector('.resize-handle'));
      if (missingHandles) {
        addResizeHandlesToHeaders();
      }
      
      // Also periodically fix any title elements that might have lost their sizing
      fixTitleElementWidths();
      
      // Reapply Linked Sections fix periodically as well
      fixLinkedSectionsColumn();
    }
  }, 5000);
}

// Replace setupStyleMaintenance with our new function
async function setupStyleMaintenance() {
  await setupTableLayout();
}

// Add column header for copy buttons
function addCopyColumnHeader() {
  console.log(`${LOG_PREFIX} Adding copy column header`);
  const table = document.querySelector('#searchResultsTable table');
  if (!table) return false;
  
  const headerRow = table.querySelector('thead tr');
  if (!headerRow) return false;
  
  // Check if we already added the header
  if (headerRow.querySelector('th.copy-button-header')) {
    console.log(`${LOG_PREFIX} Copy header already exists`);
    return true;
  }
  
  // Create a new header cell that matches the table style
  const headerCell = document.createElement('th');
  headerCell.className = 'copy-button-header ui-state-default';
  headerCell.setAttribute('scope', 'col');
  
  // Style to minimize width impact and match the table style
  headerCell.style.width = '40px';
  headerCell.style.minWidth = '40px';
  headerCell.style.maxWidth = '40px';
  headerCell.style.padding = '4px';
  headerCell.style.textAlign = 'center';
  
  // Create a styled div for the header text (matching other column headers)
  const titleDiv = document.createElement('div');
  titleDiv.className = 'title';
  titleDiv.textContent = 'Copy';
  titleDiv.style.width = 'auto';
  headerCell.appendChild(titleDiv);
  
  // Insert at the beginning of the row
  headerRow.insertBefore(headerCell, headerRow.firstChild);
  console.log(`${LOG_PREFIX} Added copy column header`);
  
  return true;
}

// Function to extract and format the data from a row
function extractRowData(row) {
  console.log(`${LOG_PREFIX} Extracting data from row:`, row.getAttribute('data-id'));
  const time = formatTime(row);
  const title = formatTitle(row);
  const location = formatLocation(row);
  const professor = formatProfessor(row);

  // Combine all elements in the requested format
  const data = `${time} - ${title} ${location} ${professor}`.trim();
  console.log(`${LOG_PREFIX} Extracted data:`, data);
  return data;
}

// Format time as "10:30-11:45 AM" (removing days and reformatting)
function formatTime(row) {
  try {
    // Get the meeting time cell for time information
    const meetingTimeCell = row.querySelector('td[data-property="meetingTime"]');
    if (!meetingTimeCell) return '';
    
    // Look for time information in the title or content
    const timeContent = meetingTimeCell.textContent || meetingTimeCell.title || '';
    
    // Use regex to extract the time range (ignoring days)
    const timeRegex = /(\d{2}:\d{2}\s*[AP]M)\s*-\s*(\d{2}:\d{2}\s*[AP]M)/i;
    const timeMatch = timeContent.match(timeRegex);
    
    if (timeMatch && timeMatch.length >= 3) {
      const startTime = timeMatch[1].replace(/\s+/g, ''); // Remove extra spaces
      const endTime = timeMatch[2].replace(/\s+/g, ''); // Remove extra spaces
      
      // If both times are AM or both PM, we can simplify
      if (startTime.endsWith(endTime.slice(-2))) {
        // Extract hour/minute portions
        const startHourMin = startTime.slice(0, -2).trim();
        const endHourMin = endTime.slice(0, -2).trim();
        const amPm = startTime.slice(-2);
        return `${startHourMin}-${endHourMin} ${amPm}`;
      } else {
        // Different AM/PM for start and end
        return `${startTime}-${endTime}`;
      }
    }
    
    // Fallback - just return whatever we found in a clean format
    return timeContent.replace(/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|,/g, '')
                      .replace(/\s+/g, ' ')
                      .trim();
  } catch (e) {
    console.error(`${LOG_PREFIX} Error in formatTime:`, e);
    return '';
  }
}

// Format title by removing the subject code (e.g., "BBST")
function formatTitle(row) {
  try {
    const titleCell = row.querySelector('td[data-property="courseTitle"] a.section-details-link');
    if (!titleCell) return '';
    
    // Get title and remove subject code (assuming it's 2-4 capital letters)
    let title = titleCell.textContent.trim();
    
    // Remove subject code if present (typically 2-5 letter uppercase codes)
    title = title.replace(/^[A-Z]{2,5}\s+/, '');
    
    return title;
  } catch (e) {
    console.error(`${LOG_PREFIX} Error in formatTitle:`, e);
    return '';
  }
}

// Format location as "@Building Room"
function formatLocation(row) {
  try {
    // Look for the meeting time cell which contains the location information in its title attribute
    const meetingTimeCell = row.querySelector('td[data-property="meetingTime"]');
    if (!meetingTimeCell || !meetingTimeCell.title) {
      return '';
    }
    
    // Use regex to extract the Class Building and Room information
    const classLocationRegex = /Type:\s*Class\s+Building:\s*([^R]+)\s+Room:\s*([^S]+)/i;
    const match = meetingTimeCell.title.match(classLocationRegex);
    
    if (match && match.length >= 3) {
      const building = match[1].trim();
      const room = match[2].trim();
      return `@${building} ${room}`;
    }
    
    // Fallback if regex doesn't match
    console.log(`${LOG_PREFIX} Could not find class location in title: ${meetingTimeCell.title}`);
    return '';
  } catch (e) {
    console.error(`${LOG_PREFIX} Error in formatLocation:`, e);
    return '';
  }
}

// Format professor as "w/Dr. First Last"
function formatProfessor(row) {
  try {
    const instructorLink = row.querySelector('td[data-property="instructor"] a.email');
    if (!instructorLink) return '';
    
    // Extract professor name and remove "(Primary)" if present
    let professor = instructorLink.textContent.trim().replace(' (Primary)', '');
    
    // If name is in "Last, First" format, convert to "First Last"
    if (professor.includes(',')) {
      const nameParts = professor.split(',').map(part => part.trim());
      professor = `${nameParts[1]} ${nameParts[0]}`;
    }
    
    return `w/Dr. ${professor}`;
  } catch (e) {
    console.error(`${LOG_PREFIX} Error in formatProfessor:`, e);
    return '';
  }
}

// Function to add copy buttons to rows - only after table is properly initialized
async function addCopyButtonsToRows() {
  console.log(`${LOG_PREFIX} Attempting to add copy buttons to rows`);
  
  // Wait for table to be fully initialized
  await waitForTableInitialization();
  
  const resultsTable = document.querySelector('#searchResultsTable table');
  if (!resultsTable) {
    console.log(`${LOG_PREFIX} Table not found in DOM after waiting`);
    return false;
  }
  
  // First make sure we have a header for the copy column
  if (!addCopyColumnHeader()) {
    console.log(`${LOG_PREFIX} Failed to add header, will try again later`);
  }
  
  console.log(`${LOG_PREFIX} Found results table`);
  const rows = resultsTable.querySelectorAll('tbody tr');
  console.log(`${LOG_PREFIX} Found ${rows.length} rows in table`);
  
  let newRowsProcessed = false;
  
  rows.forEach(row => {
    // Only check for existing buttons - don't use the Set
    if (row.querySelector('.copy-button-cell')) {
      console.log(`${LOG_PREFIX} Row already has copy button, skipping`);
      return;
    }
    
    newRowsProcessed = true;
    console.log(`${LOG_PREFIX} Processing new row ${row.getAttribute('data-id')}`);
    
    // Create a button element with compact styling
    const button = document.createElement('button');
    button.textContent = 'Copy';
    button.className = 'copy-button';
    button.style.margin = '0';
    button.style.padding = '2px 0';
    button.style.borderRadius = '3px';
    button.style.backgroundColor = '#f0f0f0';
    button.style.border = '1px solid #ccc';
    button.style.cursor = 'pointer';
    button.style.fontSize = '11px';
    button.style.width = '36px';
    button.style.height = '20px';
    
    // Create a cell for the button with proper styling
    const buttonCell = document.createElement('td');
    buttonCell.className = 'copy-button-cell';
    buttonCell.style.width = '40px';
    buttonCell.style.minWidth = '40px';
    buttonCell.style.maxWidth = '40px';
    buttonCell.style.padding = '2px';
    buttonCell.style.textAlign = 'center';
    buttonCell.appendChild(button);
    
    // Insert the button cell at the beginning of the row WITHOUT replacing any existing cells
    row.insertBefore(buttonCell, row.firstChild);
    console.log(`${LOG_PREFIX} Added button to row ${row.getAttribute('data-id')}`);
    
    // Add click event to copy the data
    button.addEventListener('click', () => {
      console.log(`${LOG_PREFIX} Copy button clicked for row ${row.getAttribute('data-id')}`);
      const data = extractRowData(row);
      navigator.clipboard.writeText(data)
        .then(() => {
          console.log(`${LOG_PREFIX} Successfully copied to clipboard: ${data}`);
          // Visual feedback that copy worked
          button.textContent = '✓';
          button.style.backgroundColor = '#d4f7d4';
          setTimeout(() => {
            button.textContent = 'Copy';
            button.style.backgroundColor = '#f0f0f0';
          }, 1500);
        })
        .catch(err => {
          console.error(`${LOG_PREFIX} Failed to copy text: `, err);
          button.textContent = '✗';
          button.style.backgroundColor = '#f7d4d4';
          setTimeout(() => {
            button.textContent = 'Copy';
            button.style.backgroundColor = '#f0f0f0';
          }, 1500);
        });
    });
  });
  
  if (newRowsProcessed) {
    console.log(`${LOG_PREFIX} Successfully added buttons to new rows`);
  } else {
    console.log(`${LOG_PREFIX} No new rows to process`);
  }
  
  return newRowsProcessed;
}

// Modify initializeObserver to include CRN column protection
function initializeObserver() {
  console.log(`${LOG_PREFIX} Initializing MutationObserver`);
  
  // Set up a MutationObserver to detect when new rows are added
  const observer = new MutationObserver((mutations) => {
    let shouldProcess = false;
    let tableClassChanged = false;
    let tableContentChanged = false;
    for (const mutation of mutations) {
      if (mutation.addedNodes.length || 
          (mutation.target && mutation.target.id === 'searchResultsTable') ||
          (mutation.target && mutation.target.closest && mutation.target.closest('#searchResultsTable'))) {
        shouldProcess = true;
        
        // Check if this might be a full table reload
        if (mutation.addedNodes.length > 2 || 
            (mutation.target && mutation.target.id === 'searchResultsTable' && mutation.addedNodes.length > 0)) {
          tableContentChanged = true;
        }
      }
      
      // Check if table classes have changed
      if (mutation.type === 'attributes' && 
          mutation.attributeName === 'class' && 
          mutation.target.tagName === 'TABLE') {
        tableClassChanged = true;
      }
    }
    
    // If classes changed, ensure all required classes are preserved
    if (tableClassChanged) {
      const table = document.querySelector('#searchResultsTable table');
      if (table) {
        ensureTableClasses(table);
      }
    }
    
    // If table content changed substantially, this might be a reload
    // Check and fix CRN position
    if (tableContentChanged) {
      setTimeout(() => {
        console.log(`${LOG_PREFIX} Table content changed significantly, checking CRN position`);
        fixCRNColumnPosition();
      }, 500);
    }
    
    if (shouldProcess) {
      // Check if the table exists and process rows
      const tableExists = document.querySelector('#searchResultsTable table');
      if (tableExists) {
        // Don't reapply styles on every mutation to avoid interfering with drag initialization
        // Just add buttons to any new rows
        addCopyButtonsToRows();
      }
    }
  });
  
  // Start observing the document for changes
  observer.observe(document.body, { childList: true, subtree: true, attributes: true });
  console.log(`${LOG_PREFIX} MutationObserver started`);
  
  // Set up a dedicated observer specifically for header changes
  const headerObserver = new MutationObserver((mutations) => {
    // Short circuit if no relevant changes
    if (!mutations.some(m => m.type === 'childList' || 
        (m.type === 'attributes' && m.attributeName === 'style'))) {
      return;
    }
    
    console.log(`${LOG_PREFIX} Header mutation detected, checking CRN position`);
    fixCRNColumnPosition();
  });
  
  // Start observing the header row if it exists
  const headerRow = document.querySelector('#searchResultsTable table thead tr');
  if (headerRow) {
    headerObserver.observe(headerRow, { 
      childList: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
      subtree: false
    });
    console.log(`${LOG_PREFIX} Header observer started`);
  } else {
    console.log(`${LOG_PREFIX} Header row not found, header observer not started`);
  }
  
  // Handle pagination changes (which might reload the table)
  document.addEventListener('click', (event) => {
    // If clicking on pagination controls
    if (event.target.closest('.paging-control') || 
        event.target.closest('.page-number') ||
        event.target.closest('.page-size-select')) {
      
      console.log(`${LOG_PREFIX} Pagination control clicked, waiting for table update`);
      
      // Wait longer for the pagination to update the table
      setTimeout(async () => {
        // Wait for table to be properly initialized after pagination
        await waitForTableInitialization();
        addCopyButtonsToRows();
        
        // Fix CRN position after pagination
        fixCRNColumnPosition();
        
        // Reset header observer after pagination
        const newHeaderRow = document.querySelector('#searchResultsTable table thead tr');
        if (newHeaderRow) {
          headerObserver.disconnect();
          headerObserver.observe(newHeaderRow, { 
            childList: true,
            attributes: true,
            attributeFilter: ['style', 'class'],
            subtree: false
          });
          console.log(`${LOG_PREFIX} Header observer reattached after pagination`);
        }
      }, 2000);
    }
  });
}

// Update the fixCRNColumnPosition function to handle special cases better
function fixCRNColumnPosition() {
  console.log(`${LOG_PREFIX} Checking if CRN column needs fixing`);
  const table = document.querySelector('#searchResultsTable table');
  if (!table) return;
  
  const headerRow = table.querySelector('thead tr');
  if (!headerRow) return;
  
  // Get all headers except the copy button header
  const headers = Array.from(headerRow.querySelectorAll('th')).filter(
    th => !th.classList.contains('copy-button-header')
  );
  
  // Find the CRN header
  let crnHeader = null;
  let crnIndex = -1;
  
  headers.forEach((header, idx) => {
    const title = header.querySelector('.title');
    if (title && title.textContent.trim() === 'CRN') {
      crnHeader = header;
      crnIndex = idx;
    }
  });
  
  if (!crnHeader) {
    console.log(`${LOG_PREFIX} CRN column not found, cannot fix position`);
    
    // Check for hidden or collapsed CRN header
    const allHeaders = Array.from(headerRow.querySelectorAll('th'));
    for (const header of allHeaders) {
      const title = header.querySelector('.title');
      if (title && title.textContent.trim() === 'CRN') {
        console.log(`${LOG_PREFIX} Found CRN header but it was filtered out`);
        
        // Fix any visibility issues
        header.style.display = '';
        header.style.visibility = 'visible';
        
        // Recursively call this function to now move the visible CRN
        fixCRNColumnPosition();
        return;
      }
    }
    
    return;
  }
  
  // Check for any visibility issues with the CRN header
  if (getComputedStyle(crnHeader).display === 'none' || 
      getComputedStyle(crnHeader).visibility === 'hidden') {
    console.log(`${LOG_PREFIX} CRN header is hidden, making it visible`);
    crnHeader.style.display = '';
    crnHeader.style.visibility = 'visible';
  }
  
  // If CRN is not first column (accounting for the copy button), move it
  if (crnIndex > 0) {
    console.log(`${LOG_PREFIX} Fixing CRN column position - moving from ${crnIndex} to 0`);
    
    // Move CRN to first position in headers
    const targetPosition = 0;
    const firstHeader = headers[targetPosition];
    headerRow.insertBefore(crnHeader, firstHeader);
    
    // Also move the corresponding cell in each body row
    const bodyRows = Array.from(table.querySelectorAll('tbody tr'));
    
    bodyRows.forEach(row => {
      const cells = Array.from(row.querySelectorAll('td')).filter(
        td => !td.classList.contains('copy-button-cell')
      );
      
      if (crnIndex < cells.length) {
        const crnCell = cells[crnIndex];
        const firstCell = cells[targetPosition];
        
        // Move CRN cell to first position
        if (crnCell && firstCell) {
          row.insertBefore(crnCell, firstCell);
        }
      }
    });
    
    console.log(`${LOG_PREFIX} CRN column position fixed`);
    
    // Ensure title element width is properly set
    const titleElem = crnHeader.querySelector('.title');
    if (titleElem) {
      titleElem.style.width = 'calc(100% - 20px)';
      titleElem.style.maxWidth = 'calc(100% - 20px)';
    }
  } else {
    console.log(`${LOG_PREFIX} CRN already in correct position`);
  }
}

// Function to execute when DOM is ready
async function onDomReady() {
  console.log(`${LOG_PREFIX} DOM ready, initializing extension`);
  
  // Initial debug check before doing anything
  debugCheckCRNColumn();
  
  // Set up the style maintenance - with proper table initialization wait
  setupStyleMaintenance();
  
  // Try to add buttons to rows (will wait for table initialization)
  setTimeout(async () => {
    console.log(`${LOG_PREFIX} Initial timeout fired, adding copy buttons`);
    await addCopyButtonsToRows();
    
    // Debug check after adding copy buttons
    debugCheckCRNColumn();
    
    // We no longer create the preference UI here since we're using a popup
    
    // Setup observer for dynamic content
    initializeObserver();
    
    // Add additional check and fix for CRN column
    setTimeout(() => {
      debugCheckCRNColumn();
      fixCRNColumnPosition();
    }, 2000);
  }, 2000);
}

// Only apply styles after the page has fully loaded - not immediately
console.log(`${LOG_PREFIX} Checking document readyState:`, document.readyState);
if (document.readyState === 'complete') {
  console.log(`${LOG_PREFIX} Document already ready, executing with delay`);
  // Even if document is ready, wait a bit to ensure all scripts have run
  setTimeout(onDomReady, 2000);
} else {
  // Wait for complete load event to ensure all scripts have initialized
  console.log(`${LOG_PREFIX} Document not ready, waiting for complete load`);
  window.addEventListener('load', () => {
    console.log(`${LOG_PREFIX} Window load event fired`);
    // Add additional delay after load to ensure table initialization
    setTimeout(onDomReady, 2000);
  });
}

// Add a mechanism to detect when user interacts with the page
// This might trigger table initializations that our code is missing
document.addEventListener('click', function(event) {
  // Check if table already has proper classes
  const table = document.querySelector('#searchResultsTable table');
  if (table && !table.classList.contains('draggable')) {
    console.log(`${LOG_PREFIX} User interaction detected, checking table initialization`);
    // Maybe user interaction helped initialize table - check again
    setTimeout(async () => {
      await addCopyButtonsToRows();
    }, 500);
  }
}, {once: false});

// Add a debugging function to check for CRN column visibility
function debugCheckCRNColumn() {
  const table = document.querySelector('#searchResultsTable table');
  if (!table) {
    console.log(`${LOG_PREFIX} DEBUG: Table not found for CRN check`);
    return;
  }
  
  const headerRow = table.querySelector('thead tr');
  if (!headerRow) {
    console.log(`${LOG_PREFIX} DEBUG: Header row not found for CRN check`);
    return;
  }
  
  const headers = Array.from(headerRow.querySelectorAll('th'));
  const headerTitles = headers.map(h => {
    const title = h.querySelector('.title');
    return title ? title.textContent.trim() : 'unknown';
  });
  
  console.log(`${LOG_PREFIX} DEBUG: Current headers:`, headerTitles);
  
  const crnIndex = headerTitles.findIndex(title => title === 'CRN');
  if (crnIndex !== -1) {
    console.log(`${LOG_PREFIX} DEBUG: CRN found at index ${crnIndex}`);
    
    // Check style/visibility
    const crnHeader = headers[crnIndex];
    console.log(`${LOG_PREFIX} DEBUG: CRN header styles:`, {
      width: crnHeader.style.width,
      minWidth: crnHeader.style.minWidth,
      display: getComputedStyle(crnHeader).display,
      visibility: getComputedStyle(crnHeader).visibility
    });
  } else {
    console.log(`${LOG_PREFIX} DEBUG: CRN header not found!`);
  }
}

// Add a click listener specifically to track CRN visibility after clicks
document.addEventListener('click', function() {
  // Small delay to let any triggered updates complete
  setTimeout(() => {
    console.log(`${LOG_PREFIX} DEBUG: User clicked, checking CRN column`);
    debugCheckCRNColumn();
  }, 500);
}, {once: false});

// Add a function to fix the Linked Sections column specifically
function fixLinkedSectionsColumn() {
  console.log(`${LOG_PREFIX} Fixing Linked Sections column overflow`);
  const table = document.querySelector('#searchResultsTable table');
  if (!table) return;
  
  // Find all headers
  const headers = Array.from(table.querySelectorAll('th'));
  
  // Look for the Linked Sections header
  headers.forEach(header => {
    const titleElem = header.querySelector('.title');
    if (titleElem && titleElem.textContent.trim() === 'Linked Sections') {
      console.log(`${LOG_PREFIX} Found Linked Sections header, applying special styling`);
      
      // Set a reasonable width for this column
      header.style.width = '120px';
      header.style.maxWidth = '120px';
      
      // Make sure the title element has the right width
      titleElem.style.width = 'calc(100% - 20px)';
      titleElem.style.maxWidth = 'calc(100% - 20px)';
    }
  });
}

console.log(`${LOG_PREFIX} Script initialization complete`);