class CatalogApp {
    constructor() {
        this.formToSubmit = null;
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupTabEventListeners();
            this.setupFormEventListeners();
            this.setupModalEventListeners();
            this.setupCatalogEventListeners();
        });
    }

    // --- UI Setup ---
    setupTabEventListeners() {
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => this.openTab(button.dataset.tab));
        });
        this.openTab('add');
    }

    setupFormEventListeners() {
        document.getElementById('add-form')?.addEventListener('submit', (e) => this.handleAddFormSubmit(e));
        document.getElementById('add_category_select')?.addEventListener('change', () => this.updateAddSubcategories());
        document.getElementById('add_subcategory_select')?.addEventListener('change', (e) => {
            const newSubcategoryInput = document.getElementById('new_subcategory_input');
            if (newSubcategoryInput) newSubcategoryInput.style.display = e.target.value === '__new__' ? 'block' : 'none';
        });

        document.getElementById('edit_category_select')?.addEventListener('change', () => this.updateEditSubcategories());
        document.getElementById('edit_subcategory_select')?.addEventListener('change', () => this.updateEditEntries());
        document.getElementById('edit_entry_select')?.addEventListener('change', () => this.loadEntryDetails());
        document.getElementById('saveEntryBtn')?.addEventListener('click', () => this.saveEntryEdit());
        document.getElementById('cancelEditBtn')?.addEventListener('click', () => this.cancelEdit());

        document.getElementById('delete_category_select_for_sub')?.addEventListener('change', () => this.updateDeleteSubcategories());
        document.getElementById('delete_category_select')?.addEventListener('change', () => this.updateDeleteEntriesSubcategories());
        document.getElementById('delete_subcategory_select_for_entry')?.addEventListener('change', () => this.updateDeleteEntries());

        const deleteCatForm = document.getElementById('deleteCatForm');
        deleteCatForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.validateAndShowModal('delete_category_select_for_cat', 'Пожалуйста, выберите категорию для удаления.', 'Вы уверены, что хотите удалить эту категорию?', deleteCatForm);
        });

        const deleteSubcatForm = document.getElementById('deleteSubcatForm');
        deleteSubcatForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.validateAndShowModal('delete_subcategory_select', 'Пожалуйста, выберите подкатегорию для удаления.', 'Вы уверены, что хотите удалить эту подкатегорию?', deleteSubcatForm);
        });

        const deleteEntryForm = document.getElementById('deleteEntryForm');
        deleteEntryForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.validateAndShowModal('delete_entry_select', 'Пожалуйста, выберите запись для удаления.', 'Вы уверены, что хотите удалить эту запись?', deleteEntryForm);
        });

        document.querySelectorAll('.restore-form').forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.showConfirmationModal('Вы уверены, что хотите восстановить базу данных из этого файла? Текущие несохраненные изменения будут потеряны.', form);
            });
        });
    }

    setupModalEventListeners() {
        const modal = document.getElementById('confirmationModal');
        const confirmBtn = document.getElementById('confirmBtn');
        const cancelBtn = document.getElementById('cancelBtn');

        if (modal && confirmBtn && cancelBtn) {
            cancelBtn.onclick = () => {
                modal.style.display = 'none';
                this.formToSubmit = null;
            }
            confirmBtn.onclick = () => {
                if (this.formToSubmit) {
                    this.formToSubmit.submit();
                }
                modal.style.display = 'none';
                this.formToSubmit = null;
            }
            window.onclick = (event) => {
                if (event.target == modal) {
                    modal.style.display = 'none';
                    this.formToSubmit = null;
                }
            }
        }
    }

    setupCatalogEventListeners() {
        // Use event delegation for dynamically added elements
        const leftSubpanel = document.querySelector('.left-subpanel');
        leftSubpanel.addEventListener('click', (e) => {
            if (e.target.classList.contains('category')) {
                this.loadSubcategories(e.target.dataset.name);
            } else if (e.target.classList.contains('subcategory')) {
                this.loadEntries(e.target.dataset.category, e.target.dataset.name);
            } else if (e.target.classList.contains('rename-link')) {
                e.stopPropagation();
                this.showRenamePrompt(e.target.dataset.type, e.target.dataset.id, e.target.dataset.name);
            }
        });
    }

    // --- AJAX Handlers ---
    // --- AJAX Handlers ---
    async _fetchJSON(url, options = {}) {
        try {
            const response = await fetch(url, options);

            if (!response.ok) {
                let errorMessage = `Ошибка сети: ${response.status} ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    // Ignore if response is not JSON
                }
                throw new Error(errorMessage);
            }

            return await response.json();
        } catch (error) {
            console.error(`Fetch error for ${url}:`, error);
            // Re-throw the error to be caught by the calling function
            throw error;
        }
    }

    handleAddFormSubmit(event) {
        event.preventDefault();
        this.toggleSpinner(true);
        const form = event.target;
        const formData = new FormData(form);

        this._fetchJSON('/add', { method: 'POST', body: formData })
            .then(data => {
                if (data.status === 'success') {
                    this.showFlashMessage(data.message, 'success');
                    form.reset();
                    document.getElementById('new_category_input').style.display = 'none';
                    document.getElementById('new_subcategory_input').style.display = 'none';
                    this.updateUIAfterAdd(data.data);
                } else {
                    this.showFlashMessage(data.message || 'Произошла неизвестная ошибка.', 'error');
                }
            })
            .catch(error => {
                this.showFlashMessage(error.message || 'Не удалось добавить запись. Проверьте сетевое подключение.', 'error');
            })
            .finally(() => {
                this.toggleSpinner(false);
            });
    }

    // --- DOM Manipulation ---
    updateUIAfterAdd(data) {
        if (data.is_new.category) {
            const newOption = new Option(data.category_name, data.category_name);
            document.querySelectorAll('select[name="category_select"], select#delete_category_select_for_cat, select#delete_category_select_for_sub').forEach(sel => {
                const referenceNode = sel.querySelector('option[value="__new__"]');
                sel.insertBefore(newOption.cloneNode(true), referenceNode);
            });

            const leftSubpanel = document.querySelector('.left-subpanel');
            const p = document.createElement('p');
            p.className = 'category';
            p.dataset.name = data.category_name;
            p.textContent = data.category_name;
            const a = document.createElement('a');
            a.href = '#';
            a.className = 'rename-link';
            a.dataset.type = 'category';
            a.dataset.id = data.category_id;
            a.dataset.name = data.category_name;
            a.textContent = '[Переименовать]';
            p.appendChild(a);
            leftSubpanel.appendChild(p);
        }

        if (data.is_new.subcategory) {
            const categoryEl = document.querySelector(`.category[data-name="${data.category_name}"]`);
            if (categoryEl) {
                const p = document.createElement('p');
                p.className = 'indented subcategory';
                p.dataset.category = data.category_name;
                p.dataset.name = data.subcategory_name;
                p.textContent = data.subcategory_name;
                const a = document.createElement('a');
                a.href = '#';
                a.className = 'rename-link';
                a.dataset.type = 'subcategory';
                a.dataset.id = data.subcategory_id;
                a.dataset.name = data.subcategory_name;
                a.textContent = '[Переименовать]';
                p.appendChild(a);
                categoryEl.parentNode.insertBefore(p, categoryEl.nextSibling);
            }
        }
        
        this.loadEntries(data.category_name, data.subcategory_name, data.entry_id);
    }

    // --- Helper Functions ---
    showFlashMessage(message, category) {
        let container = document.querySelector('.flashes');
        if (!container) {
            container = document.createElement('div');
            container.className = 'flashes';
            document.body.insertBefore(container, document.body.firstChild);
        }
        const flashDiv = document.createElement('div');
        flashDiv.className = `flash ${category}`;
        flashDiv.textContent = message;
        container.appendChild(flashDiv);

        setTimeout(() => {
            flashDiv.style.opacity = '0';
            setTimeout(() => flashDiv.remove(), 500);
        }, 5000);
    }

    toggleSpinner(show) {
        const spinner = document.getElementById('spinner');
        if(spinner) spinner.style.display = show ? 'block' : 'none';
    }

    // --- Main Logic ---
    openTab(tabName) {
        document.querySelectorAll(".tab-content").forEach(tab => tab.style.display = "none");
        document.getElementById(tabName).style.display = "block";
        document.querySelectorAll(".tab-button").forEach(btn => btn.classList.remove("active"));
        document.querySelector(`button[data-tab='${tabName}']`).classList.add("active");
    }

    showConfirmationModal(message, form) {
        const modal = document.getElementById('confirmationModal');
        const modalMessage = document.getElementById('modalMessage');
        if (modal && modalMessage) {
            modalMessage.textContent = message;
            modal.style.display = 'flex';
            this.formToSubmit = form;
        }
        return false;
    }

    validateAndShowModal(selectId, validationMessage, modalMessage, form) {
        const selectElement = document.getElementById(selectId);
        if (!selectElement || selectElement.value === '') {
            alert(validationMessage);
            return false;
        }
        return this.showConfirmationModal(modalMessage, form);
    }

    showRenamePrompt(type, id, oldName) {
        const newName = prompt(`Введите новое имя для "${oldName}":`, oldName);
        if (newName && newName.trim() !== '' && newName !== oldName) {
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = `/rename/${type}/${id}`;

            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'new_name';
            input.value = newName;
            form.appendChild(input);

            document.body.appendChild(form);
            form.submit();
        }
    }

    updateAddSubcategories() {
        this.toggleSpinner(true);
        const categoryName = document.getElementById('add_category_select').value;
        const newCategoryInput = document.getElementById('new_category_input');
        const subcategorySelect = document.getElementById('add_subcategory_select');
        const newSubcategoryInput = document.getElementById('new_subcategory_input');

        if (categoryName === '__new__') {
            newCategoryInput.style.display = 'block';
            subcategorySelect.innerHTML = '<option value="">Выберите подкатегорию</option><option value="__new__">+ Добавить новую</option>';
            newSubcategoryInput.style.display = 'block';
            this.toggleSpinner(false);
        } else if (categoryName) {
            newCategoryInput.style.display = 'none';
            this._fetchJSON(`/get_subcategories?category=${encodeURIComponent(categoryName)}`)
                .then(subcategories => {
                    subcategorySelect.innerHTML = '<option value="">Выберите подкатегорию</option>';
                    subcategories.forEach(sub => {
                        const option = document.createElement('option');
                        option.value = sub.name;
                        option.textContent = sub.name;
                        subcategorySelect.appendChild(option);
                    });
                    subcategorySelect.innerHTML += '<option value="__new__">+ Добавить новую</option>';
                })
                .catch(error => this.showFlashMessage(`Ошибка загрузки подкатегорий: ${error.message}`, 'error'))
                .finally(() => this.toggleSpinner(false));
        } else {
            newCategoryInput.style.display = 'none';
            subcategorySelect.innerHTML = '<option value="">Выберите подкатегорию</option>';
            newSubcategoryInput.style.display = 'none';
            this.toggleSpinner(false);
        }
        newSubcategoryInput.style.display = subcategorySelect.value === '__new__' ? 'block' : 'none';
    }

    updateEditSubcategories() {
        this.toggleSpinner(true);
        const categoryName = document.getElementById('edit_category_select').value;
        const subcategorySelect = document.getElementById('edit_subcategory_select');
        if (categoryName) {
            this._fetchJSON(`/get_subcategories?category=${encodeURIComponent(categoryName)}`)
                .then(subcategories => {
                    subcategorySelect.innerHTML = '<option value="">Выберите подкатегорию</option>';
                    subcategories.forEach(sub => {
                        const option = document.createElement('option');
                        option.value = sub.name;
                        option.textContent = sub.name;
                        subcategorySelect.appendChild(option);
                    });
                })
                .catch(error => this.showFlashMessage(`Ошибка загрузки подкатегорий: ${error.message}`, 'error'))
                .finally(() => this.toggleSpinner(false));
        } else {
            subcategorySelect.innerHTML = '<option value="">Выберите подкатегорию</option>';
            this.toggleSpinner(false);
        }
    }

    updateEditEntries() {
        this.toggleSpinner(true);
        const categoryName = document.getElementById('edit_category_select').value;
        const subcategoryName = document.getElementById('edit_subcategory_select').value;
        if (categoryName && subcategoryName) {
            this._fetchJSON(`/get_entries?category=${encodeURIComponent(categoryName)}&subcategory=${encodeURIComponent(subcategoryName)}`)
                .then(entries => {
                    const select = document.getElementById('edit_entry_select');
                    select.innerHTML = '<option value="">Выберите запись</option>';
                    entries.forEach(entry => {
                        const option = document.createElement('option');
                        option.value = entry.id;
                        option.textContent = entry.title;
                        select.appendChild(option);
                    });
                })
                .catch(error => this.showFlashMessage(`Ошибка загрузки записей: ${error.message}`, 'error'))
                .finally(() => this.toggleSpinner(false));
        } else {
            this.toggleSpinner(false);
        }
    }

    loadEntryDetails() {
        this.toggleSpinner(true);
        const categoryName = document.getElementById('edit_category_select').value;
        const subcategoryName = document.getElementById('edit_subcategory_select').value;
        const entryId = document.getElementById('edit_entry_select').value;
        if (categoryName && subcategoryName && entryId) {
            this._fetchJSON(`/get_entry_details?category=${encodeURIComponent(categoryName)}&subcategory=${encodeURIComponent(subcategoryName)}`)
                .then(entries => {
                    const entry = entries.find(e => e.id == entryId);
                    if (entry) {
                        document.getElementById('edit_entry_id').value = entry.id;
                        document.getElementById('edit_entry_title').value = entry.title;
                        document.getElementById('edit_urls').value = entry.urls.join('\n');
                    }
                })
                .catch(error => this.showFlashMessage(`Ошибка загрузки деталей записи: ${error.message}`, 'error'))
                .finally(() => this.toggleSpinner(false));
        } else {
            this.toggleSpinner(false);
        }
    }

    updateDeleteSubcategories() {
        this.toggleSpinner(true);
        const categoryId = document.getElementById('delete_category_select_for_sub').value;
        fetch(`/get_subcategories?category_id=${categoryId}`)
            .then(response => {
                if (!response.ok) throw new Error('Сетевая ошибка: ' + response.status);
                return response.json();
            })
            .then(subcategories => {
                const select = document.getElementById('delete_subcategory_select');
                select.innerHTML = '<option value="">Выберите подкатегорию</option>';
                subcategories.forEach(sub => {
                    const option = document.createElement('option');
                    option.value = sub.id;
                    option.textContent = sub.name;
                    select.appendChild(option);
                });
            })
            .catch(error => console.error('Ошибка загрузки подкатегорий:', error))
            .finally(() => this.toggleSpinner(false));
    }

    updateDeleteEntriesSubcategories() {
        this.toggleSpinner(true);
        const categoryName = document.getElementById('delete_category_select').value;
        if (categoryName) {
            fetch(`/get_subcategories?category=${encodeURIComponent(categoryName)}`)
                .then(response => {
                    if (!response.ok) throw new Error('Сетевая ошибка: ' + response.status);
                    return response.json();
                })
                .then(subcategories => {
                    const select = document.getElementById('delete_subcategory_select_for_entry');
                    select.innerHTML = '<option value="">Выберите подкатегорию</option>';
                    subcategories.forEach(sub => {
                        const option = document.createElement('option');
                        option.value = sub.name;
                        option.textContent = sub.name;
                        select.appendChild(option);
                    });
                })
                .catch(error => console.error('Ошибка загрузки подкатегорий для удаления записи:', error))
                .finally(() => this.toggleSpinner(false));
        } else {
            this.toggleSpinner(false);
        }
    }

    updateDeleteSubcategories() {
        this.toggleSpinner(true);
        const categoryId = document.getElementById('delete_category_select_for_sub').value;
        this._fetchJSON(`/get_subcategories?category_id=${categoryId}`)
            .then(subcategories => {
                const select = document.getElementById('delete_subcategory_select');
                select.innerHTML = '<option value="">Выберите подкатегорию</option>';
                subcategories.forEach(sub => {
                    const option = document.createElement('option');
                    option.value = sub.id;
                    option.textContent = sub.name;
                    select.appendChild(option);
                });
            })
            .catch(error => this.showFlashMessage(`Ошибка загрузки подкатегорий: ${error.message}`, 'error'))
            .finally(() => this.toggleSpinner(false));
    }

    updateDeleteEntriesSubcategories() {
        this.toggleSpinner(true);
        const categoryName = document.getElementById('delete_category_select').value;
        if (categoryName) {
            this._fetchJSON(`/get_subcategories?category=${encodeURIComponent(categoryName)}`)
                .then(subcategories => {
                    const select = document.getElementById('delete_subcategory_select_for_entry');
                    select.innerHTML = '<option value="">Выберите подкатегорию</option>';
                    subcategories.forEach(sub => {
                        const option = document.createElement('option');
                        option.value = sub.name;
                        option.textContent = sub.name;
                        select.appendChild(option);
                    });
                })
                .catch(error => this.showFlashMessage(`Ошибка загрузки подкатегорий: ${error.message}`, 'error'))
                .finally(() => this.toggleSpinner(false));
        } else {
            this.toggleSpinner(false);
        }
    }

    updateDeleteEntries() {
        this.toggleSpinner(true);
        const categoryName = document.getElementById('delete_category_select').value;
        const subcategoryName = document.getElementById('delete_subcategory_select_for_entry').value;
        if (categoryName && subcategoryName) {
            this._fetchJSON(`/get_entries?category=${encodeURIComponent(categoryName)}&subcategory=${encodeURIComponent(subcategoryName)}`)
                .then(entries => {
                    const select = document.getElementById('delete_entry_select');
                    select.innerHTML = '<option value="">Выберите запись</option>';
                    entries.forEach(entry => {
                        const option = document.createElement('option');
                        option.value = entry.id;
                        option.textContent = entry.title;
                        select.appendChild(option);
                    });
                })
                .catch(error => this.showFlashMessage(`Ошибка загрузки записей: ${error.message}`, 'error'))
                .finally(() => this.toggleSpinner(false));
        } else {
            this.toggleSpinner(false);
        }
    }

    loadSubcategories(categoryName) {
        this.toggleSpinner(true);
        document.querySelectorAll('.category').forEach(el => el.classList.remove('selected'));
        document.querySelector(`p[data-name='${categoryName}']`).classList.add('selected');
        
        this._fetchJSON(`/get_subcategories?category=${encodeURIComponent(categoryName)}`)
            .then(subcategories => {
                // This function only loads subcategories in the main view, which is now handled by page reload/redirect.
                // We can leave this as is or refactor to dynamically update the list.
                // For now, just log it.
                console.log('Subcategories loaded:', subcategories);
            })
            .catch(error => this.showFlashMessage(`Ошибка загрузки подкатегорий: ${error.message}`, 'error'))
            .finally(() => this.toggleSpinner(false));
    }

    loadEntries(categoryName, subcategoryName, highlightEntryId = null) {
        this.toggleSpinner(true);
        document.querySelectorAll('.subcategory').forEach(el => el.classList.remove('selected'));
        const subcatEl = document.querySelector(`p[data-name='${subcategoryName}'][data-category='${categoryName}']`);
        if (subcatEl) subcatEl.classList.add('selected');
        
        this._fetchJSON(`/get_entry_details?category=${encodeURIComponent(categoryName)}&subcategory=${encodeURIComponent(subcategoryName)}`)
            .then(entries => {
                const entryList = document.getElementById('entry_list');
                entryList.innerHTML = '';
                if (entries.length === 0) {
                    entryList.innerHTML = '<li>Нет записей в этой подкатегории</li>';
                } else {
                    entries.forEach(entry => {
                        const li = document.createElement('li');
                        li.innerHTML = `<strong>${entry.title}</strong> <a href="#" class="edit-entry-link" data-id="${entry.id}" data-title="${entry.title.replace(/'/g, "'")}" data-urls="${entry.urls.join('\n').replace(/'/g, "'")}">[Редактировать]</a>`;
                        li.setAttribute('data-entry-id', entry.id);
                        if (entry.urls && entry.urls.length > 0) {
                            const ul = document.createElement('ul');
                            entry.urls.forEach(url => {
                                const urlLi = document.createElement('li');
                                urlLi.innerHTML = `<a href="${url}" target="_blank">${url}</a>`;
                                ul.appendChild(urlLi);
                            });
                            li.appendChild(ul);
                        }
                        entryList.appendChild(li);
                    });
                    document.querySelectorAll('.edit-entry-link').forEach(a => {
                        a.addEventListener('click', (e) => {
                            e.preventDefault();
                            this.showEditForm(a.dataset.id, a.dataset.title, a.dataset.urls);
                        });
                    });

                    if (highlightEntryId) {
                        const entryToHighlight = entryList.querySelector(`li[data-entry-id="${highlightEntryId}"]`);
                        if (entryToHighlight) {
                            entryToHighlight.classList.add('newly-added');
                            setTimeout(() => {
                                entryToHighlight.classList.remove('newly-added');
                            }, 2000);
                        }
                    }
                }
            })
            .catch(error => {
                this.showFlashMessage(`Ошибка загрузки записей: ${error.message}`, 'error');
                document.getElementById('entry_list').innerHTML = '<li>Ошибка загрузки записей</li>';
            })
            .finally(() => this.toggleSpinner(false));
    }

    showEditForm(entryId, title, urls) {
        document.getElementById('edit_entry_id_form').value = entryId;
        document.getElementById('edit_entry_title_form').value = title;
        document.getElementById('edit_urls_form').value = urls;
        document.getElementById('edit_entry_form').style.display = 'block';
    }

    saveEntryEdit() {
        this.toggleSpinner(true);
        const entryId = document.getElementById('edit_entry_id_form').value;
        const newTitle = document.getElementById('edit_entry_title_form').value;
        const newUrls = document.getElementById('edit_urls_form').value.split('\n').filter(url => url.trim());
        
        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entry_id: entryId, new_title: newTitle, new_urls: newUrls })
        };

        this._fetchJSON('/edit_entry', options)
            .then(data => {
                if (data.status === 'success') {
                    document.getElementById('edit_entry_form').style.display = 'none';
                    const activeCategory = document.querySelector('.category.selected');
                    const activeSubcategory = document.querySelector('.subcategory.selected');
                    if (activeCategory && activeSubcategory) {
                        this.loadEntries(activeCategory.dataset.name, activeSubcategory.dataset.name);
                    } else {
                        location.reload();
                    }
                } else {
                    this.showFlashMessage(data.message || 'Не удалось сохранить запись.', 'error');
                }
            })
            .catch(error => this.showFlashMessage(`Ошибка сохранения: ${error.message}`, 'error'))
            .finally(() => this.toggleSpinner(false));
    }

    loadSubcategories(categoryName) {
        this.toggleSpinner(true);
        document.querySelectorAll('.category').forEach(el => el.classList.remove('selected'));
        document.querySelector(`p[data-name='${categoryName}']`).classList.add('selected');
        
        fetch(`/get_subcategories?category=${encodeURIComponent(categoryName)}`)
            .then(response => response.json())
            .then(subcategories => {
                // This function only loads subcategories in the main view, which is now handled by page reload/redirect.
                // We can leave this as is or refactor to dynamically update the list.
                // For now, just log it.
                console.log('Subcategories loaded:', subcategories);
            })
            .catch(error => console.error('Ошибка загрузки подкатегорий:', error))
            .finally(() => this.toggleSpinner(false));
    }

    loadEntries(categoryName, subcategoryName, highlightEntryId = null) {
        this.toggleSpinner(true);
        document.querySelectorAll('.subcategory').forEach(el => el.classList.remove('selected'));
        const subcatEl = document.querySelector(`p[data-name='${subcategoryName}'][data-category='${categoryName}']`);
        if (subcatEl) subcatEl.classList.add('selected');
        
        fetch(`/get_entry_details?category=${encodeURIComponent(categoryName)}&subcategory=${encodeURIComponent(subcategoryName)}`)
            .then(response => {
                if (!response.ok) throw new Error('Сетевая ошибка: ' + response.status);
                return response.json();
            })
            .then(entries => {
                const entryList = document.getElementById('entry_list');
                entryList.innerHTML = '';
                if (entries.length === 0) {
                    entryList.innerHTML = '<li>Нет записей в этой подкатегории</li>';
                } else {
                    entries.forEach(entry => {
                        const li = document.createElement('li');
                        li.innerHTML = `<strong>${entry.title}</strong> <a href="#" class="edit-entry-link" data-id="${entry.id}" data-title="${entry.title.replace(/'/g, "'")}" data-urls="${entry.urls.join('\n').replace(/'/g, "'")}">[Редактировать]</a>`;
                        li.setAttribute('data-entry-id', entry.id);
                        if (entry.urls && entry.urls.length > 0) {
                            const ul = document.createElement('ul');
                            entry.urls.forEach(url => {
                                const urlLi = document.createElement('li');
                                urlLi.innerHTML = `<a href="${url}" target="_blank">${url}</a>`;
                                ul.appendChild(urlLi);
                            });
                            li.appendChild(ul);
                        }
                        entryList.appendChild(li);
                    });
                    document.querySelectorAll('.edit-entry-link').forEach(a => {
                        a.addEventListener('click', (e) => {
                            e.preventDefault();
                            this.showEditForm(a.dataset.id, a.dataset.title, a.dataset.urls);
                        });
                    });

                    if (highlightEntryId) {
                        const entryToHighlight = entryList.querySelector(`li[data-entry-id="${highlightEntryId}"]`);
                        if (entryToHighlight) {
                            entryToHighlight.classList.add('newly-added');
                            setTimeout(() => {
                                entryToHighlight.classList.remove('newly-added');
                            }, 2000);
                        }
                    }
                }
            })
            .catch(error => {
                console.error('Ошибка загрузки записей:', error);
                document.getElementById('entry_list').innerHTML = '<li>Ошибка загрузки записей</li>';
            })
            .finally(() => this.toggleSpinner(false));
    }

    showEditForm(entryId, title, urls) {
        document.getElementById('edit_entry_id_form').value = entryId;
        document.getElementById('edit_entry_title_form').value = title;
        document.getElementById('edit_urls_form').value = urls;
        document.getElementById('edit_entry_form').style.display = 'block';
    }

    saveEntryEdit() {
        this.toggleSpinner(true);
        const entryId = document.getElementById('edit_entry_id_form').value;
        const newTitle = document.getElementById('edit_entry_title_form').value;
        const newUrls = document.getElementById('edit_urls_form').value.split('\n').filter(url => url.trim());
        fetch('/edit_entry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entry_id: entryId, new_title: newTitle, new_urls: newUrls })
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    document.getElementById('edit_entry_form').style.display = 'none';
                    const activeCategory = document.querySelector('.category.selected');
                    const activeSubcategory = document.querySelector('.subcategory.selected');
                    if (activeCategory && activeSubcategory) {
                        this.loadEntries(activeCategory.dataset.name, activeSubcategory.dataset.name);
                    } else {
                        location.reload();
                    }
                }
            })
            .catch(error => console.error('Ошибка сохранения записи:', error))
            .finally(() => this.toggleSpinner(false));
    }

    cancelEdit() {
        document.getElementById('edit_entry_form').style.display = 'none';
    }
}

new CatalogApp();