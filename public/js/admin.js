let apiKey = localStorage.getItem('apiKey');
const API_BASE_URL = 'https://pdfcreator-eta.vercel.app/api/v1';

// Загружаем шаблоны при загрузке страницы, если есть API ключ
window.onload = function() {
    console.log('Page loaded, API key exists:', !!apiKey);
    if (apiKey) {
        loadTemplates();
    }
};

function setApiKey() {
    const newApiKey = document.getElementById('apiKey').value;
    if (newApiKey) {
        console.log('Setting new API key');
        apiKey = newApiKey;
        localStorage.setItem('apiKey', apiKey);
        document.getElementById('apiKey').value = '';
        loadTemplates();
        showSuccess('API key has been set successfully');
    } else {
        showError('Please enter an API key');
    }
}

async function loadTemplates() {
    try {
        console.log('Loading templates with API key:', apiKey);
        const response = await fetch(`${API_BASE_URL}/templates`, {
            headers: {
                'X-API-Key': apiKey
            }
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Error response:', errorData);
            throw new Error(errorData.message || 'Failed to load templates. Please check your API key.');
        }
        
        const data = await response.json();
        console.log('Templates loaded:', data);
        
        if (data.templates && data.templates.length > 0) {
            displayTemplates(data.templates);
        } else {
            document.getElementById('templatesList').innerHTML = '<div class="no-templates">No templates found. Create your first template below!</div>';
        }
    } catch (error) {
        console.error('Error in loadTemplates:', error);
        showError(error.message);
        document.getElementById('templatesList').innerHTML = '<div class="no-templates">Failed to load templates. Please check your API key.</div>';
    }
}

function displayTemplates(templates) {
    const templatesDiv = document.getElementById('templatesList');
    templatesDiv.innerHTML = '';

    templates.forEach(template => {
        const templateElement = document.createElement('div');
        templateElement.className = 'template-item';
        templateElement.innerHTML = `
            <div class="template-header">
                <div class="template-info">
                    <h3>${template.name}</h3>
                    <p>${template.description || 'No description'}</p>
                </div>
                <div class="template-actions">
                    <button onclick="viewTemplate(${template.id})" class="btn-primary">View</button>
                    <button onclick="editTemplate(${template.id})" class="btn-warning">Edit</button>
                    <button onclick="deleteTemplate(${template.id})" class="btn-danger">Delete</button>
                </div>
            </div>
            <div id="template-details-${template.id}" class="template-details">
                <h4>Template Details</h4>
                <p><strong>ID:</strong> ${template.id}</p>
                <p><strong>Name:</strong> ${template.name}</p>
                <p><strong>Description:</strong> ${template.description || 'No description'}</p>
                <div id="template-html-${template.id}"></div>
            </div>
        `;
        templatesDiv.appendChild(templateElement);
    });
}

async function createTemplate() {
    const name = document.getElementById('templateName').value;
    const description = document.getElementById('templateDescription').value;
    const htmlContent = document.getElementById('templateHtml').value;

    if (!name || !htmlContent) {
        showError('Name and HTML content are required');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/templates`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey
            },
            body: JSON.stringify({ name, description, html_content: htmlContent })
        });

        const data = await response.json();
        if (response.ok) {
            showSuccess('Template created successfully');
            loadTemplates();
            clearForm();
        } else {
            showError('Failed to create template: ' + data.message);
        }
    } catch (error) {
        showError('Error creating template: ' + error.message);
    }
}

async function deleteTemplate(id) {
    if (!confirm('Are you sure you want to delete this template?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/templates/${id}`, {
            method: 'DELETE',
            headers: {
                'X-API-Key': apiKey
            }
        });

        if (response.ok) {
            showSuccess('Template deleted successfully');
            loadTemplates();
        } else {
            const data = await response.json();
            showError('Failed to delete template: ' + data.message);
        }
    } catch (error) {
        showError('Error deleting template: ' + error.message);
    }
}

async function viewTemplate(id) {
    try {
        const detailsDiv = document.getElementById(`template-details-${id}`);
        const htmlDiv = document.getElementById(`template-html-${id}`);

        // Toggle details visibility
        if (detailsDiv.classList.contains('show')) {
            detailsDiv.classList.remove('show');
            return;
        }

        // Hide all other details
        document.querySelectorAll('.template-details').forEach(div => {
            div.classList.remove('show');
        });

        const response = await fetch(`${API_BASE_URL}/templates/${id}`, {
            headers: {
                'X-API-Key': apiKey
            }
        });

        if (response.ok) {
            const template = await response.json();
            htmlDiv.innerHTML = `
                <h4>HTML Content:</h4>
                <pre>${escapeHtml(template.html_content)}</pre>
            `;
            detailsDiv.classList.add('show');
        } else {
            const data = await response.json();
            showError('Failed to load template details: ' + data.message);
        }
    } catch (error) {
        showError('Error loading template details: ' + error.message);
    }
}

function escapeHtml(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
}

async function editTemplate(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/templates/${id}`, {
            headers: {
                'X-API-Key': apiKey
            }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message);
        }

        const template = await response.json();

        document.getElementById('templateName').value = template.name;
        document.getElementById('templateDescription').value = template.description || '';
        document.getElementById('templateHtml').value = template.html_content;

        // Change create button to update button
        const createButton = document.querySelector('.template-form button');
        createButton.textContent = 'Update Template';
        createButton.onclick = () => updateTemplate(id);

        // Scroll to form
        document.querySelector('.template-form').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        showError('Error loading template for editing: ' + error.message);
    }
}

async function updateTemplate(id) {
    const name = document.getElementById('templateName').value;
    const description = document.getElementById('templateDescription').value;
    const htmlContent = document.getElementById('templateHtml').value;

    try {
        const response = await fetch(`${API_BASE_URL}/templates/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey
            },
            body: JSON.stringify({ name, description, html_content: htmlContent })
        });

        const data = await response.json();
        if (response.ok) {
            showSuccess('Template updated successfully');
            loadTemplates();
            clearForm();
            resetForm();
        } else {
            showError('Failed to update template: ' + data.message);
        }
    } catch (error) {
        showError('Error updating template: ' + error.message);
    }
}

function clearForm() {
    document.getElementById('templateName').value = '';
    document.getElementById('templateDescription').value = '';
    document.getElementById('templateHtml').value = '';
}

function resetForm() {
    const createButton = document.querySelector('.template-form button');
    createButton.textContent = 'Create Template';
    createButton.onclick = createTemplate;
}

function showError(message) {
    const container = document.querySelector('.container');
    const error = document.createElement('div');
    error.className = 'error';
    error.textContent = message;
    container.insertBefore(error, container.firstChild);
    setTimeout(() => error.remove(), 5000);
}

function showSuccess(message) {
    const container = document.querySelector('.container');
    const success = document.createElement('div');
    success.className = 'success';
    success.textContent = message;
    container.insertBefore(success, container.firstChild);
    setTimeout(() => success.remove(), 5000);
} 