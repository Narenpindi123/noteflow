/**
 * NoteFlow - Notion-Inspired Note Taking App
 * With Firebase Firestore for real-time cross-device sync
 */

// ===========================================
// Data Store & State Management
// ===========================================

const STORAGE_KEY = 'noteflow_data';
const COLLECTION_NAME = 'pages';

const BLOCK_TYPES = {
    paragraph: { icon: '📝', title: 'Text', description: 'Just start writing with plain text' },
    heading1: { icon: '📌', title: 'Heading 1', description: 'Big section heading' },
    heading2: { icon: '📎', title: 'Heading 2', description: 'Medium section heading' },
    heading3: { icon: '📍', title: 'Heading 3', description: 'Small section heading' },
    bullet: { icon: '•', title: 'Bullet List', description: 'Create a simple bullet list' },
    numbered: { icon: '1.', title: 'Numbered List', description: 'Create a numbered list' },
    checkbox: { icon: '☑️', title: 'To-do List', description: 'Track tasks with a to-do list' },
    table: { icon: '📊', title: 'Table', description: 'Add a simple table' },
    quote: { icon: '❝', title: 'Quote', description: 'Capture a quote' },
    divider: { icon: '—', title: 'Divider', description: 'Visually divide blocks' },
    code: { icon: '💻', title: 'Code', description: 'Capture a code snippet' },
    callout: { icon: '💡', title: 'Callout', description: 'Make content stand out' }
};

const PAGE_ICONS = ['📄', '📝', '📋', '📌', '📎', '📍', '📓', '📔', '📒', '📕', '📗', '📘', '📙', '🗂️', '💼', '🎯', '💡', '🔖', '⭐', '🏠', '🚀', '🎨', '💻', '📊', '📈'];

let state = {
    pages: [],
    currentPageId: null,
    draggedBlockId: null,
    firebaseReady: false,
    unsubscribe: null, // For Firebase listener cleanup
    isEditing: false,  // Prevent re-renders while editing
    focusedBlockId: null, // Currently focused block
    pendingFocusBlockId: null // Block to focus after render
};

// ===========================================
// Utility Functions
// ===========================================

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ===========================================
// Firebase Operations
// ===========================================

async function savePageToFirebase(page) {
    if (!window.firebaseReady || !window.firebaseDB) {
        // Fallback to localStorage
        saveToLocalStorage();
        return;
    }

    try {
        const docRef = window.firebaseDoc(window.firebaseDB, COLLECTION_NAME, page.id);
        await window.firebaseSetDoc(docRef, {
            ...page,
            updatedAt: Date.now()
        });
    } catch (error) {
        console.error('Error saving to Firebase:', error);
        // Fallback to localStorage
        saveToLocalStorage();
    }
}

async function deletePageFromFirebase(pageId) {
    if (!window.firebaseReady || !window.firebaseDB) return;

    try {
        const docRef = window.firebaseDoc(window.firebaseDB, COLLECTION_NAME, pageId);
        await window.firebaseDeleteDoc(docRef);
    } catch (error) {
        console.error('Error deleting from Firebase:', error);
    }
}

function setupFirebaseListener() {
    if (!window.firebaseReady || !window.firebaseDB) return;

    try {
        const collectionRef = window.firebaseCollection(window.firebaseDB, COLLECTION_NAME);

        // Real-time listener for changes
        state.unsubscribe = window.firebaseOnSnapshot(collectionRef, (snapshot) => {
            const pages = [];
            snapshot.forEach((doc) => {
                pages.push(doc.data());
            });

            // Sort by creation date
            pages.sort((a, b) => a.createdAt - b.createdAt);

            // Check if we need to create default page
            if (pages.length === 0) {
                createDefaultPage();
                return;
            }

            // Update state
            const currentPageStillExists = pages.some(p => p.id === state.currentPageId);
            state.pages = pages;

            if (!currentPageStillExists && pages.length > 0) {
                state.currentPageId = pages[0].id;
            }

            // Re-render only if not currently editing
            if (!state.isEditing) {
                renderPagesList();
                renderPage();
            }

            // Show sync indicator
            showSyncIndicator();
        }, (error) => {
            console.error('Firebase listener error:', error);
            showToast('Sync error - using local storage');
            loadFromLocalStorage();
        });
    } catch (error) {
        console.error('Error setting up Firebase listener:', error);
    }
}

function showSyncIndicator() {
    // Brief visual feedback that sync happened
    const logo = document.querySelector('.logo svg');
    if (logo) {
        logo.style.transition = 'transform 0.3s ease';
        logo.style.transform = 'rotate(360deg)';
        setTimeout(() => {
            logo.style.transform = 'rotate(0deg)';
        }, 300);
    }
}

// ===========================================
// Local Storage (Fallback)
// ===========================================

function saveToLocalStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.pages));
}

function loadFromLocalStorage() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        state.pages = JSON.parse(data);
    }

    if (state.pages.length === 0) {
        createDefaultPage();
    } else {
        state.currentPageId = state.pages[0]?.id;
        renderPagesList();
        renderPage();
    }
}

// ===========================================
// Page Creation
// ===========================================

function createDefaultPage() {
    const defaultPage = createPage('Getting Started');
    defaultPage.blocks = [
        { id: generateId(), type: 'heading1', content: '👋 Welcome to NoteFlow!' },
        { id: generateId(), type: 'paragraph', content: 'This is your personal workspace. Start writing, organizing, and thinking.' },
        { id: generateId(), type: 'heading2', content: '✨ Quick Tips' },
        { id: generateId(), type: 'bullet', content: 'Type / to see all block types' },
        { id: generateId(), type: 'bullet', content: 'Press Enter to create a new block' },
        { id: generateId(), type: 'bullet', content: 'Press Backspace on an empty block to delete it' },
        { id: generateId(), type: 'bullet', content: 'Drag blocks to reorder them' },
        { id: generateId(), type: 'divider', content: '' },
        { id: generateId(), type: 'checkbox', content: 'Try creating a to-do item', checked: false },
        { id: generateId(), type: 'checkbox', content: 'Click the + in the sidebar to create a new page', checked: false },
        { id: generateId(), type: 'quote', content: 'The best way to predict the future is to create it.' },
        { id: generateId(), type: 'callout', content: '🔄 Your notes sync across all devices in real-time!' }
    ];

    state.pages.push(defaultPage);
    state.currentPageId = defaultPage.id;

    savePageToFirebase(defaultPage);
    saveToLocalStorage();

    renderPagesList();
    renderPage();
}

function createPage(title = 'Untitled') {
    return {
        id: generateId(),
        title: title,
        icon: PAGE_ICONS[Math.floor(Math.random() * PAGE_ICONS.length)],
        blocks: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
}

function getCurrentPage() {
    return state.pages.find(p => p.id === state.currentPageId);
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.querySelector('.toast-message').textContent = message;
    toast.classList.add('active');
    setTimeout(() => toast.classList.remove('active'), 2500);
}

// Debounce function for save operations
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Debounced save to prevent too many writes
const debouncedSave = debounce((page) => {
    savePageToFirebase(page);
    saveToLocalStorage();
}, 500);

// ===========================================
// DOM Rendering
// ===========================================

function renderPagesList() {
    const pagesList = document.getElementById('pagesList');
    pagesList.innerHTML = '';

    state.pages.forEach(page => {
        const pageItem = document.createElement('button');
        pageItem.className = `page-item ${page.id === state.currentPageId ? 'active' : ''}`;
        pageItem.onclick = () => switchToPage(page.id);

        pageItem.innerHTML = `
            <span class="page-item-icon">${page.icon}</span>
            <span class="page-item-title">${page.title || 'Untitled'}</span>
            <div class="page-item-actions">
                <button class="page-action-btn" onclick="event.stopPropagation(); deletePage('${page.id}')" title="Delete page">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                </button>
            </div>
        `;

        pagesList.appendChild(pageItem);
    });
}

function renderPage() {
    const page = getCurrentPage();
    if (!page) return;

    // Update page header
    document.getElementById('pageIcon').textContent = page.icon;
    const titleEl = document.getElementById('pageTitle');
    titleEl.textContent = page.title;

    // Render blocks
    renderBlocks();
}

function renderBlocks() {
    const page = getCurrentPage();
    const editor = document.getElementById('editor');
    editor.innerHTML = '';

    if (!page) return;

    page.blocks.forEach((block, index) => {
        const blockEl = createBlockElement(block, index);
        editor.appendChild(blockEl);
    });

    // Update numbered list numbers
    updateNumberedLists();
}

function createBlockElement(block, index) {
    const blockEl = document.createElement('div');
    blockEl.className = 'block';
    blockEl.dataset.id = block.id;
    blockEl.dataset.type = block.type;
    blockEl.draggable = true;

    // Handle checkbox checked state
    if (block.type === 'checkbox' && block.checked) {
        blockEl.classList.add('checked');
    }

    // Drag handle
    const handle = document.createElement('div');
    handle.className = 'block-handle';
    handle.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="6" r="1.5"/>
            <circle cx="15" cy="6" r="1.5"/>
            <circle cx="9" cy="12" r="1.5"/>
            <circle cx="15" cy="12" r="1.5"/>
            <circle cx="9" cy="18" r="1.5"/>
            <circle cx="15" cy="18" r="1.5"/>
        </svg>
    `;
    blockEl.appendChild(handle);

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'block-delete-btn';
    deleteBtn.title = 'Delete block';
    deleteBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
    `;
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        deleteBlock(block.id);
    };
    blockEl.appendChild(deleteBtn);

    // Checkbox input (for checkbox type)
    if (block.type === 'checkbox') {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'block-checkbox';
        checkbox.checked = block.checked || false;
        checkbox.onchange = () => toggleCheckbox(block.id);
        blockEl.appendChild(checkbox);
    }

    // Callout icon (for callout type)
    if (block.type === 'callout') {
        const calloutIcon = document.createElement('span');
        calloutIcon.className = 'callout-icon';
        calloutIcon.textContent = '💡';
        blockEl.appendChild(calloutIcon);
    }

    // Table block
    if (block.type === 'table') {
        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'block-table-wrapper';

        // Initialize table data if not present
        if (!block.tableData) {
            block.tableData = [
                ['Header 1', 'Header 2', 'Header 3'],
                ['Cell 1', 'Cell 2', 'Cell 3'],
                ['Cell 4', 'Cell 5', 'Cell 6']
            ];
        }

        const table = document.createElement('table');
        table.className = 'block-table';

        block.tableData.forEach((row, rowIndex) => {
            const tr = document.createElement('tr');
            row.forEach((cell, colIndex) => {
                const td = document.createElement(rowIndex === 0 ? 'th' : 'td');
                td.contentEditable = true;
                td.textContent = cell;
                td.addEventListener('input', () => {
                    block.tableData[rowIndex][colIndex] = td.textContent;
                    const page = getCurrentPage();
                    debouncedSave(page);
                });
                td.addEventListener('keydown', (e) => {
                    if (e.key === 'Tab') {
                        e.preventDefault();
                        // Move to next cell
                        const nextCell = e.shiftKey
                            ? td.previousElementSibling || tr.previousElementSibling?.lastElementChild
                            : td.nextElementSibling || tr.nextElementSibling?.firstElementChild;
                        if (nextCell) nextCell.focus();
                    }
                });
                tr.appendChild(td);
            });
            table.appendChild(tr);
        });

        tableWrapper.appendChild(table);

        // Table controls
        const controls = document.createElement('div');
        controls.className = 'table-controls';
        controls.innerHTML = `
            <button class="table-control-btn add" onclick="addTableRow('${block.id}')" title="Add row">+ Row</button>
            <button class="table-control-btn add" onclick="addTableColumn('${block.id}')" title="Add column">+ Col</button>
            <button class="table-control-btn remove" onclick="removeTableRow('${block.id}')" title="Remove last row">− Row</button>
            <button class="table-control-btn remove" onclick="removeTableColumn('${block.id}')" title="Remove last column">− Col</button>
        `;
        tableWrapper.appendChild(controls);

        blockEl.appendChild(tableWrapper);
        return blockEl;
    }

    // Block content (for non-table blocks)
    const content = document.createElement('div');
    content.className = 'block-content';
    content.contentEditable = block.type !== 'divider';
    content.spellcheck = true;

    if (block.type !== 'divider') {
        content.textContent = block.content;
        content.setAttribute('placeholder', getPlaceholder(block.type));
    }

    // Event listeners
    content.addEventListener('input', () => handleBlockInput(block.id, content));
    content.addEventListener('keydown', (e) => handleBlockKeydown(e, block.id));
    content.addEventListener('paste', handlePaste);
    content.addEventListener('focus', () => {
        state.isEditing = true;
        state.focusedBlockId = block.id;
        handleBlockFocus(block.id);
    });
    content.addEventListener('blur', () => {
        // Longer delay to allow for brief pauses while typing
        setTimeout(() => {
            // Only clear editing state if user hasn't focused another block
            if (state.focusedBlockId === block.id) {
                state.isEditing = false;
            }
        }, 500);
    });

    blockEl.appendChild(content);

    // Drag events
    blockEl.addEventListener('dragstart', handleDragStart);
    blockEl.addEventListener('dragend', handleDragEnd);
    blockEl.addEventListener('dragover', handleDragOver);
    blockEl.addEventListener('drop', handleDrop);

    // Context menu
    blockEl.addEventListener('contextmenu', handleContextMenu);

    return blockEl;
}

// Table helper functions
function addTableRow(blockId) {
    const page = getCurrentPage();
    const block = page.blocks.find(b => b.id === blockId);
    if (block && block.tableData) {
        const colCount = block.tableData[0]?.length || 3;
        block.tableData.push(new Array(colCount).fill(''));
        savePageToFirebase(page);
        saveToLocalStorage();
        renderBlocks();
        showToast('Row added');
    }
}

function addTableColumn(blockId) {
    const page = getCurrentPage();
    const block = page.blocks.find(b => b.id === blockId);
    if (block && block.tableData) {
        block.tableData.forEach((row, index) => {
            row.push(index === 0 ? 'Header' : '');
        });
        savePageToFirebase(page);
        saveToLocalStorage();
        renderBlocks();
        showToast('Column added');
    }
}

function removeTableRow(blockId) {
    const page = getCurrentPage();
    const block = page.blocks.find(b => b.id === blockId);
    if (block && block.tableData && block.tableData.length > 1) {
        block.tableData.pop();
        savePageToFirebase(page);
        saveToLocalStorage();
        renderBlocks();
        showToast('Row removed');
    } else {
        showToast('Cannot remove the last row');
    }
}

function removeTableColumn(blockId) {
    const page = getCurrentPage();
    const block = page.blocks.find(b => b.id === blockId);
    if (block && block.tableData && block.tableData[0]?.length > 1) {
        block.tableData.forEach(row => row.pop());
        savePageToFirebase(page);
        saveToLocalStorage();
        renderBlocks();
        showToast('Column removed');
    } else {
        showToast('Cannot remove the last column');
    }
}

function getPlaceholder(type) {
    const placeholders = {
        paragraph: "Type '/' for commands...",
        heading1: 'Heading 1',
        heading2: 'Heading 2',
        heading3: 'Heading 3',
        bullet: 'List item',
        numbered: 'List item',
        checkbox: 'To-do',
        quote: 'Empty quote',
        code: 'Code',
        callout: 'Type something...'
    };
    return placeholders[type] || '';
}

function updateNumberedLists() {
    const page = getCurrentPage();
    if (!page) return;

    let number = 0;
    page.blocks.forEach(block => {
        if (block.type === 'numbered') {
            number++;
            const blockEl = document.querySelector(`.block[data-id="${block.id}"]`);
            if (blockEl) {
                blockEl.dataset.number = number;
            }
        } else if (block.type !== 'numbered') {
            number = 0; // Reset counter for non-numbered blocks
        }
    });
}

// ===========================================
// Block Operations
// ===========================================

function handleBlockInput(blockId, contentEl) {
    const page = getCurrentPage();
    const block = page.blocks.find(b => b.id === blockId);
    if (block) {
        block.content = contentEl.textContent;
        page.updatedAt = Date.now();
        debouncedSave(page);
    }
}

function handleBlockKeydown(e, blockId) {
    const page = getCurrentPage();
    const blockIndex = page.blocks.findIndex(b => b.id === blockId);
    const block = page.blocks[blockIndex];
    const content = e.target.textContent;

    // Handle Enter key
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();

        // Get cursor position and split content
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const cursorPos = range.startOffset;
        const textBefore = content.slice(0, cursorPos);
        const textAfter = content.slice(cursorPos);

        // Update current block
        block.content = textBefore;
        e.target.textContent = textBefore;

        // Determine new block type (continue list types)
        let newType = 'paragraph';
        if (['bullet', 'numbered', 'checkbox'].includes(block.type)) {
            if (content.trim() === '') {
                // Convert empty list item to paragraph
                block.type = 'paragraph';
                savePageToFirebase(page);
                saveToLocalStorage();
                renderBlocks();
                focusBlock(blockId);
                return;
            }
            newType = block.type;
        }

        // Create new block
        const newBlock = {
            id: generateId(),
            type: newType,
            content: textAfter,
            checked: false
        };

        page.blocks.splice(blockIndex + 1, 0, newBlock);
        savePageToFirebase(page);
        saveToLocalStorage();
        renderBlocks();

        // Use requestAnimationFrame to ensure DOM is updated before focusing
        requestAnimationFrame(() => {
            focusBlock(newBlock.id, 0);
        });
    }

    // Handle Backspace on empty block
    if (e.key === 'Backspace' && content === '' && page.blocks.length > 1) {
        e.preventDefault();

        const prevBlock = page.blocks[blockIndex - 1];
        page.blocks.splice(blockIndex, 1);
        savePageToFirebase(page);
        saveToLocalStorage();
        renderBlocks();

        if (prevBlock) {
            focusBlock(prevBlock.id, prevBlock.content.length);
        }
    }

    // Handle Tab for indentation (future feature)
    if (e.key === 'Tab') {
        e.preventDefault();
        // Could implement indentation here
    }

    // Handle / for command palette - only when block is empty
    if (e.key === '/' && content === '') {
        e.preventDefault(); // Prevent / from being typed
        showCommandPalette(blockId);
    }

    // Arrow key navigation
    if (e.key === 'ArrowUp' && blockIndex > 0) {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);

        // Check if cursor is at the beginning
        if (range.startOffset === 0) {
            e.preventDefault();
            const prevBlock = page.blocks[blockIndex - 1];
            focusBlock(prevBlock.id, prevBlock.content.length);
        }
    }

    if (e.key === 'ArrowDown' && blockIndex < page.blocks.length - 1) {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);

        // Check if cursor is at the end
        if (range.startOffset === content.length) {
            e.preventDefault();
            const nextBlock = page.blocks[blockIndex + 1];
            focusBlock(nextBlock.id, 0);
        }
    }
}

function handleBlockFocus(blockId) {
    // Remove active class from all blocks
    document.querySelectorAll('.block').forEach(b => b.classList.remove('focused'));

    // Add active class to focused block
    const blockEl = document.querySelector(`.block[data-id="${blockId}"]`);
    if (blockEl) {
        blockEl.classList.add('focused');
    }
}

function handlePaste(e) {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
}

function focusBlock(blockId, cursorPos = null) {
    const blockEl = document.querySelector(`.block[data-id="${blockId}"]`);
    if (!blockEl) return;

    const content = blockEl.querySelector('.block-content');
    if (!content) return;

    // Focus the content element
    content.focus();

    // Set cursor position
    const sel = window.getSelection();
    const range = document.createRange();

    try {
        if (content.childNodes.length === 0 || content.textContent === '') {
            // Empty block - just set cursor at start
            range.selectNodeContents(content);
            range.collapse(true);
        } else if (cursorPos !== null) {
            const textNode = content.firstChild;
            const maxPos = textNode.textContent ? textNode.textContent.length : 0;
            const pos = Math.min(cursorPos, maxPos);

            if (textNode.nodeType === Node.TEXT_NODE) {
                range.setStart(textNode, pos);
                range.collapse(true);
            } else {
                range.selectNodeContents(content);
                range.collapse(cursorPos === 0);
            }
        } else {
            // No position specified, put cursor at end
            range.selectNodeContents(content);
            range.collapse(false);
        }

        sel.removeAllRanges();
        sel.addRange(range);
    } catch (err) {
        // Fallback: just focus
        content.focus();
    }
}

function addNewBlock(type = 'paragraph', afterBlockId = null) {
    const page = getCurrentPage();
    if (!page) return;

    const newBlock = {
        id: generateId(),
        type: type,
        content: '',
        checked: false
    };

    if (afterBlockId) {
        const index = page.blocks.findIndex(b => b.id === afterBlockId);
        page.blocks.splice(index + 1, 0, newBlock);
    } else {
        page.blocks.push(newBlock);
    }

    savePageToFirebase(page);
    saveToLocalStorage();
    renderBlocks();

    if (type !== 'divider') {
        focusBlock(newBlock.id);
    }

    return newBlock;
}

function deleteBlock(blockId) {
    const page = getCurrentPage();
    if (!page) return;

    const index = page.blocks.findIndex(b => b.id === blockId);

    if (index > -1 && page.blocks.length > 1) {
        page.blocks.splice(index, 1);
        savePageToFirebase(page);
        saveToLocalStorage();
        renderBlocks();
        showToast('Block deleted');

        // Focus previous or next block
        const focusIndex = Math.max(0, index - 1);
        if (page.blocks[focusIndex]) {
            focusBlock(page.blocks[focusIndex].id);
        }
    } else if (page.blocks.length <= 1) {
        showToast('Cannot delete the last block');
    }
}

function duplicateBlock(blockId) {
    const page = getCurrentPage();
    const index = page.blocks.findIndex(b => b.id === blockId);
    const block = page.blocks[index];

    if (block) {
        const newBlock = {
            ...block,
            id: generateId()
        };
        page.blocks.splice(index + 1, 0, newBlock);
        savePageToFirebase(page);
        saveToLocalStorage();
        renderBlocks();
        focusBlock(newBlock.id);
        showToast('Block duplicated');
    }
}

function changeBlockType(blockId, newType) {
    const page = getCurrentPage();
    const block = page.blocks.find(b => b.id === blockId);

    if (block) {
        block.type = newType;
        if (newType === 'divider') {
            block.content = '';
        }
        savePageToFirebase(page);
        saveToLocalStorage();
        renderBlocks();

        if (newType !== 'divider') {
            focusBlock(blockId);
        }
    }
}

function toggleCheckbox(blockId) {
    const page = getCurrentPage();
    const block = page.blocks.find(b => b.id === blockId);

    if (block && block.type === 'checkbox') {
        block.checked = !block.checked;
        savePageToFirebase(page);
        saveToLocalStorage();

        const blockEl = document.querySelector(`.block[data-id="${blockId}"]`);
        if (blockEl) {
            blockEl.classList.toggle('checked', block.checked);
        }
    }
}

// ===========================================
// Drag & Drop
// ===========================================

function handleDragStart(e) {
    const blockEl = e.target.closest('.block');
    if (!blockEl) return;

    state.draggedBlockId = blockEl.dataset.id;
    blockEl.classList.add('dragging');

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', blockEl.dataset.id);
}

function handleDragEnd(e) {
    const blockEl = e.target.closest('.block');
    if (blockEl) {
        blockEl.classList.remove('dragging');
    }

    document.querySelectorAll('.block').forEach(b => b.classList.remove('drag-over'));
    state.draggedBlockId = null;
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const blockEl = e.target.closest('.block');
    if (blockEl && blockEl.dataset.id !== state.draggedBlockId) {
        document.querySelectorAll('.block').forEach(b => b.classList.remove('drag-over'));
        blockEl.classList.add('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();

    const targetBlock = e.target.closest('.block');
    if (!targetBlock || !state.draggedBlockId) return;

    const page = getCurrentPage();
    const fromIndex = page.blocks.findIndex(b => b.id === state.draggedBlockId);
    const toIndex = page.blocks.findIndex(b => b.id === targetBlock.dataset.id);

    if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
        const [movedBlock] = page.blocks.splice(fromIndex, 1);
        page.blocks.splice(toIndex, 0, movedBlock);
        savePageToFirebase(page);
        saveToLocalStorage();
        renderBlocks();
    }

    targetBlock.classList.remove('drag-over');
}

// ===========================================
// Command Palette
// ===========================================

let currentCommandBlockId = null;
let selectedCommandIndex = 0;

function showCommandPalette(blockId) {
    currentCommandBlockId = blockId;
    selectedCommandIndex = 0;

    const overlay = document.getElementById('commandPaletteOverlay');
    const search = document.getElementById('commandSearch');
    const list = document.getElementById('commandList');

    // Populate command list
    renderCommandList('');

    overlay.classList.add('active');
    search.value = '';
    search.focus();

    // Update selection
    updateCommandSelection();
}

function hideCommandPalette() {
    const overlay = document.getElementById('commandPaletteOverlay');
    overlay.classList.remove('active');
    currentCommandBlockId = null;

    // Refocus the block if we have one
    if (currentCommandBlockId) {
        focusBlock(currentCommandBlockId);
    }
}

function renderCommandList(filter) {
    const list = document.getElementById('commandList');
    list.innerHTML = '';

    const filterLower = filter.toLowerCase();

    Object.entries(BLOCK_TYPES).forEach(([type, info], index) => {
        if (info.title.toLowerCase().includes(filterLower) ||
            info.description.toLowerCase().includes(filterLower)) {

            const item = document.createElement('button');
            item.className = 'command-item';
            item.dataset.type = type;
            item.dataset.index = index;

            item.innerHTML = `
                <span class="command-item-icon">${info.icon}</span>
                <div class="command-item-info">
                    <div class="command-item-title">${info.title}</div>
                    <div class="command-item-description">${info.description}</div>
                </div>
            `;

            item.onclick = () => selectCommand(type);
            item.onmouseenter = () => {
                selectedCommandIndex = Array.from(list.children).indexOf(item);
                updateCommandSelection();
            };

            list.appendChild(item);
        }
    });

    selectedCommandIndex = 0;
    updateCommandSelection();
}

function updateCommandSelection() {
    const items = document.querySelectorAll('.command-item');
    items.forEach((item, index) => {
        item.classList.toggle('selected', index === selectedCommandIndex);
    });
}

function selectCommand(type) {
    if (currentCommandBlockId) {
        changeBlockType(currentCommandBlockId, type);
    }
    hideCommandPalette();
}

function handleCommandSearch(e) {
    const query = e.target.value;
    renderCommandList(query);
}

function handleCommandKeydown(e) {
    const items = document.querySelectorAll('.command-item');

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedCommandIndex = Math.min(selectedCommandIndex + 1, items.length - 1);
        updateCommandSelection();
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedCommandIndex = Math.max(selectedCommandIndex - 1, 0);
        updateCommandSelection();
    } else if (e.key === 'Enter') {
        e.preventDefault();
        const selectedItem = items[selectedCommandIndex];
        if (selectedItem) {
            selectCommand(selectedItem.dataset.type);
        }
    } else if (e.key === 'Escape') {
        hideCommandPalette();
    }
}

// ===========================================
// Context Menu
// ===========================================

let currentContextBlockId = null;

function handleContextMenu(e) {
    e.preventDefault();

    const blockEl = e.target.closest('.block');
    if (!blockEl) return;

    currentContextBlockId = blockEl.dataset.id;

    const menu = document.getElementById('contextMenu');
    menu.style.left = `${e.clientX}px`;
    menu.style.top = `${e.clientY}px`;
    menu.classList.add('active');

    // Close on click outside
    setTimeout(() => {
        document.addEventListener('click', hideContextMenu, { once: true });
    }, 0);
}

function hideContextMenu() {
    const menu = document.getElementById('contextMenu');
    menu.classList.remove('active');
    currentContextBlockId = null;
}

function handleContextAction(action) {
    if (!currentContextBlockId) return;

    switch (action) {
        case 'duplicate':
            duplicateBlock(currentContextBlockId);
            break;
        case 'delete':
            deleteBlock(currentContextBlockId);
            break;
        case 'turnInto':
            showCommandPalette(currentContextBlockId);
            break;
    }

    hideContextMenu();
}

// ===========================================
// Page Management
// ===========================================

function switchToPage(pageId) {
    state.currentPageId = pageId;
    renderPagesList();
    renderPage();
}

function addNewPage() {
    const newPage = createPage('Untitled');
    newPage.blocks.push({
        id: generateId(),
        type: 'paragraph',
        content: ''
    });

    state.pages.push(newPage);
    savePageToFirebase(newPage);
    saveToLocalStorage();

    switchToPage(newPage.id);

    // Focus the title
    setTimeout(() => {
        const titleEl = document.getElementById('pageTitle');
        titleEl.focus();

        // Select all text
        const range = document.createRange();
        range.selectNodeContents(titleEl);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }, 100);

    showToast('New page created');
}

function deletePage(pageId) {
    if (state.pages.length <= 1) {
        showToast("Can't delete the last page");
        return;
    }

    const index = state.pages.findIndex(p => p.id === pageId);
    if (index > -1) {
        const pageName = state.pages[index].title || 'Untitled';
        state.pages.splice(index, 1);

        // Delete from Firebase
        deletePageFromFirebase(pageId);

        // Switch to another page if we deleted the current one
        if (state.currentPageId === pageId) {
            state.currentPageId = state.pages[0].id;
        }

        saveToLocalStorage();
        renderPagesList();
        renderPage();
        showToast(`"${pageName}" deleted`);
    }
}

function handleTitleChange() {
    const page = getCurrentPage();
    const titleEl = document.getElementById('pageTitle');

    if (page) {
        page.title = titleEl.textContent || 'Untitled';
        page.updatedAt = Date.now();
        debouncedSave(page);
        renderPagesList();
    }
}

function handleIconClick() {
    const page = getCurrentPage();
    if (!page) return;

    // Cycle to next icon
    const currentIndex = PAGE_ICONS.indexOf(page.icon);
    const nextIndex = (currentIndex + 1) % PAGE_ICONS.length;
    page.icon = PAGE_ICONS[nextIndex];

    savePageToFirebase(page);
    saveToLocalStorage();
    document.getElementById('pageIcon').textContent = page.icon;
    renderPagesList();
}

// ===========================================
// Theme Management
// ===========================================

function initTheme() {
    const savedTheme = localStorage.getItem('noteflow_theme') || 'light';
    document.documentElement.dataset.theme = savedTheme;
}

function toggleTheme() {
    const currentTheme = document.documentElement.dataset.theme;
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.dataset.theme = newTheme;
    localStorage.setItem('noteflow_theme', newTheme);

    showToast(`${newTheme === 'dark' ? 'Dark' : 'Light'} mode enabled`);
}

// ===========================================
// Sidebar
// ===========================================

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
    localStorage.setItem('noteflow_sidebar', sidebar.classList.contains('collapsed') ? 'collapsed' : 'expanded');
}

function initSidebar() {
    const savedState = localStorage.getItem('noteflow_sidebar');
    if (savedState === 'collapsed') {
        document.getElementById('sidebar').classList.add('collapsed');
    }
}

// ===========================================
// Initialization
// ===========================================

function init() {
    // Initialize theme and sidebar
    initTheme();
    initSidebar();

    // Set up event listeners
    document.getElementById('addPageBtn').addEventListener('click', addNewPage);
    document.getElementById('sidebarToggle').addEventListener('click', toggleSidebar);
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('pageTitle').addEventListener('input', handleTitleChange);
    document.getElementById('pageTitle').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            // Focus first block
            const page = getCurrentPage();
            if (page && page.blocks.length > 0) {
                focusBlock(page.blocks[0].id);
            }
        }
    });
    document.getElementById('pageIcon').addEventListener('click', handleIconClick);

    // Add block hint
    document.getElementById('addBlockHint').addEventListener('click', () => {
        const newBlock = addNewBlock();
        if (newBlock) {
            showCommandPalette(newBlock.id);
        }
    });

    // Command palette
    document.getElementById('commandSearch').addEventListener('input', handleCommandSearch);
    document.getElementById('commandSearch').addEventListener('keydown', handleCommandKeydown);
    document.getElementById('commandPaletteOverlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            hideCommandPalette();
        }
    });

    // Context menu
    document.querySelectorAll('.context-menu-item').forEach(item => {
        item.addEventListener('click', () => handleContextAction(item.dataset.action));
    });

    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Escape to close modals
        if (e.key === 'Escape') {
            hideCommandPalette();
            hideContextMenu();
        }

        // Cmd/Ctrl + N for new page
        if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
            e.preventDefault();
            addNewPage();
        }

        // Cmd/Ctrl + / for command palette
        if ((e.metaKey || e.ctrlKey) && e.key === '/') {
            e.preventDefault();
            const page = getCurrentPage();
            if (page && page.blocks.length > 0) {
                // Find focused block or use first block
                const focusedBlock = document.querySelector('.block:focus-within');
                const blockId = focusedBlock?.dataset.id || page.blocks[0].id;
                showCommandPalette(blockId);
            }
        }
    });

    // Handle window resize for mobile sidebar
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            document.getElementById('sidebar').classList.remove('collapsed');
        }
    });

    // Wait for Firebase or use local storage
    if (window.firebaseReady) {
        setupFirebaseListener();
        showToast('🔄 Syncing enabled');
    } else {
        // Wait for Firebase to be ready
        window.addEventListener('firebase-ready', () => {
            setupFirebaseListener();
            showToast('🔄 Syncing enabled');
        });

        // Fallback: load from local storage if Firebase takes too long
        setTimeout(() => {
            if (!state.firebaseReady && state.pages.length === 0) {
                loadFromLocalStorage();
            }
        }, 3000);
    }
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
