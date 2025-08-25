
        function updateAddSubcategories() {
            var categoryName = document.getElementById('add_category_select').value;
            var newCategoryInput = document.getElementById('new_category_input');
            var subcategorySelect = document.getElementById('add_subcategory_select');
            var newSubcategoryInput = document.getElementById('new_subcategory_input');

            if (categoryName === '__new__') {
                newCategoryInput.style.display = 'block';
                subcategorySelect.innerHTML = '<option value="">Выберите подкатегорию</option><option value="__new__">+ Добавить новую</option>';
                newSubcategoryInput.style.display = 'block';
            } else if (categoryName) {
                newCategoryInput.style.display = 'none';
                fetch(`/get_subcategories?category=${encodeURIComponent(categoryName)}`)
                    .then(response => response.json())
                    .then(subcategories => {
                        subcategorySelect.innerHTML = '<option value="">Выберите подкатегорию</option>';
                        subcategories.forEach(sub => {
                            var option = document.createElement('option');
                            option.value = sub.name;
                            option.textContent = sub.name;
                            subcategorySelect.appendChild(option);
                        });
                        subcategorySelect.innerHTML += '<option value="__new__">+ Добавить новую</option>';
                    })
                    .catch(error => console.error('Ошибка загрузки подкатегорий:', error));
            } else {
                newCategoryInput.style.display = 'none';
                subcategorySelect.innerHTML = '<option value="">Выберите подкатегорию</option>';
                newSubcategoryInput.style.display = 'none';
            }
            newSubcategoryInput.style.display = subcategorySelect.value === '__new__' ? 'block' : 'none';
        }

        function updateEditSubcategories() {
            var categoryName = document.getElementById('edit_category_select').value;
            var subcategorySelect = document.getElementById('edit_subcategory_select');
            if (categoryName) {
                fetch(`/get_subcategories?category=${encodeURIComponent(categoryName)}`)
                    .then(response => response.json())
                    .then(subcategories => {
                        subcategorySelect.innerHTML = '<option value="">Выберите подкатегорию</option>';
                        subcategories.forEach(sub => {
                            var option = document.createElement('option');
                            option.value = sub.name;
                            option.textContent = sub.name;
                            subcategorySelect.appendChild(option);
                        });
                    })
                    .catch(error => console.error('Ошибка загрузки подкатегорий:', error));
            } else {
                subcategorySelect.innerHTML = '<option value="">Выберите подкатегорию</option>';
            }
        }

        function updateEditEntries() {
            var categoryName = document.getElementById('edit_category_select').value;
            var subcategoryName = document.getElementById('edit_subcategory_select').value;
            if (categoryName && subcategoryName) {
                fetch(`/get_entries?category=${encodeURIComponent(categoryName)}&subcategory=${encodeURIComponent(subcategoryName)}`)
                    .then(response => response.json())
                    .then(entries => {
                        var select = document.getElementById('edit_entry_select');
                        select.innerHTML = '<option value="">Выберите запись</option>';
                        entries.forEach(entry => {
                            var option = document.createElement('option');
                            option.value = entry.id;
                            option.textContent = entry.title;
                            select.appendChild(option);
                        });
                    })
                    .catch(error => console.error('Ошибка загрузки записей:', error));
            }
        }

        function loadEntryDetails() {
            var categoryName = document.getElementById('edit_category_select').value;
            var subcategoryName = document.getElementById('edit_subcategory_select').value;
            var entryId = document.getElementById('edit_entry_select').value;
            if (categoryName && subcategoryName && entryId) {
                fetch(`/get_entry_details?category=${encodeURIComponent(categoryName)}&subcategory=${encodeURIComponent(subcategoryName)}`)
                    .then(response => response.json())
                    .then(entries => {
                        var entry = entries.find(e => e.id == entryId);
                        if (entry) {
                            document.getElementById('edit_entry_id').value = entry.id;
                            document.getElementById('edit_entry_title').value = entry.title;
                            document.getElementById('edit_urls').value = entry.urls.join('\n');
                        }
                    })
                    .catch(error => console.error('Ошибка загрузки деталей записи:', error));
            }
        }

        function updateDeleteSubcategories() {
            var categoryId = document.getElementById('delete_category_select_for_sub').value;
            console.log('Запрос подкатегорий для категории ID:', categoryId);
            fetch(`/get_subcategories?category_id=${categoryId}`)
                .then(response => {
                    if (!response.ok) throw new Error('Сетевая ошибка: ' + response.status);
                    return response.json();
                })
                .then(subcategories => {
                    var select = document.getElementById('delete_subcategory_select');
                    select.innerHTML = '<option value="">Выберите подкатегорию</option>';
                    subcategories.forEach(sub => {
                        var option = document.createElement('option');
                        option.value = sub.id;
                        option.textContent = sub.name;
                        select.appendChild(option);
                    });
                })
                .catch(error => console.error('Ошибка загрузки подкатегорий:', error));
        }

        function updateDeleteEntriesSubcategories() {
            var categoryName = document.getElementById('delete_category_select').value;
            console.log('Запрос подкатегорий для категории:', categoryName);
            if (categoryName) {
                fetch(`/get_subcategories?category=${encodeURIComponent(categoryName)}`)
                    .then(response => {
                        if (!response.ok) throw new Error('Сетевая ошибка: ' + response.status);
                        return response.json();
                    })
                    .then(subcategories => {
                        var select = document.getElementById('delete_subcategory_select_for_entry');
                        select.innerHTML = '<option value="">Выберите подкатегорию</option>';
                        subcategories.forEach(sub => {
                            var option = document.createElement('option');
                            option.value = sub.name;
                            option.textContent = sub.name;
                            select.appendChild(option);
                        });
                    })
                    .catch(error => console.error('Ошибка загрузки подкатегорий для удаления записи:', error));
            }
        }

        function updateDeleteEntries() {
            var categoryName = document.getElementById('delete_category_select').value;
            var subcategoryName = document.getElementById('delete_subcategory_select_for_entry').value;
            console.log('Запрос записей для:', categoryName, subcategoryName);
            if (categoryName && subcategoryName) {
                fetch(`/get_entries?category=${encodeURIComponent(categoryName)}&subcategory=${encodeURIComponent(subcategoryName)}`)
                    .then(response => {
                        if (!response.ok) throw new Error('Сетевая ошибка: ' + response.status);
                        return response.json();
                    })
                    .then(entries => {
                        var select = document.getElementById('delete_entry_select');
                        select.innerHTML = '<option value="">Выберите запись</option>';
                        entries.forEach(entry => {
                            var option = document.createElement('option');
                            option.value = entry.id;
                            option.textContent = entry.title;
                            select.appendChild(option);
                        });
                    })
                    .catch(error => console.error('Ошибка загрузки записей:', error));
            }
        }

        function loadSubcategories(categoryName) {
            // Снимаем выделение со всех категорий
            document.querySelectorAll('.category').forEach(el => el.classList.remove('selected'));
            // Добавляем выделение выбранной категории
            event.target.classList.add('selected');
            
            console.log('Загрузка подкатегорий для категории:', categoryName);
            fetch(`/get_subcategories?category=${encodeURIComponent(categoryName)}`)
                .then(response => response.json())
                .then(subcategories => {
                    console.log('Подкатегории:', subcategories);
                    // Снимаем выделение со всех подкатегорий
                    document.querySelectorAll('.subcategory').forEach(el => el.classList.remove('selected'));
                })
                .catch(error => console.error('Ошибка загрузки подкатегорий:', error));
        }

        function loadEntries(categoryName, subcategoryName) {
            // Снимаем выделение со всех подкатегорий
            document.querySelectorAll('.subcategory').forEach(el => el.classList.remove('selected'));
            // Добавляем выделение выбранной подкатегории
            var subcategories = document.querySelectorAll('.subcategory');
            subcategories.forEach(sub => {
                if (sub.textContent === subcategoryName) {
                    sub.classList.add('selected');
                }
            });
            
            console.log('Загрузка записей для:', categoryName, subcategoryName);
            fetch(`/get_entry_details?category=${encodeURIComponent(categoryName)}&subcategory=${encodeURIComponent(subcategoryName)}`)
                .then(response => {
                    if (!response.ok) throw new Error('Сетевая ошибка: ' + response.status);
                    return response.json();
                })
                .then(entries => {
                    console.log('Полученные записи:', entries);
                    var entryList = document.getElementById('entry_list');
                    entryList.innerHTML = '';
                    if (entries.length === 0) {
                        entryList.innerHTML = '<li>Нет записей в этой подкатегории</li>';
                    } else {
                        entries.forEach(entry => {
                            // Добавляем выделение для обновленной записи
                            var li = document.createElement('li');
                            li.innerHTML = `<strong>${entry.title}</strong> <a href="#" onclick="showEditForm(${entry.id}, '${entry.title.replace(/'/g, "'")}', '${entry.urls.join('\n').replace(/'/g, "'")}')">Редактировать</a>`;
                            li.setAttribute('data-entry-id', entry.id);
                            if (entry.urls && entry.urls.length > 0) {
                                var ul = document.createElement('ul');
                                entry.urls.forEach(url => {
                                    var urlLi = document.createElement('li');
                                    urlLi.innerHTML = `<a href="${url}" target="_blank">${url}</a>`;
                                    ul.appendChild(urlLi);
                                });
                                li.appendChild(ul);
                            }
                            entryList.appendChild(li);
                        });
                    }
                })
                .catch(error => {
                    console.error('Ошибка загрузки записей:', error);
                    document.getElementById('entry_list').innerHTML = '<li>Ошибка загрузки записей</li>';
                });
        }

        function showEditForm(entryId, title, urls) {
            document.getElementById('edit_entry_id_form').value = entryId;
            document.getElementById('edit_entry_title_form').value = title;
            document.getElementById('edit_urls_form').value = urls;
            document.getElementById('edit_entry_form').style.display = 'block';
        }

        function saveEntryEdit() {
            var entryId = document.getElementById('edit_entry_id_form').value;
            var newTitle = document.getElementById('edit_entry_title_form').value;
            var newUrls = document.getElementById('edit_urls_form').value.split('\n').filter(url => url.trim());
            fetch('/edit_entry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entry_id: entryId, new_title: newTitle, new_urls: newUrls })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        document.getElementById('edit_entry_form').style.display = 'none';
                        var categorySelect = document.getElementById('delete_category_select');
                        var subcategorySelect = document.getElementById('delete_subcategory_select_for_entry');
                        
                        // Получаем текущие выбранные категорию и подкатегорию из правой панели
                        var activeCategory = document.querySelector('.category.selected');
                        var activeSubcategory = document.querySelector('.subcategory.selected');
                        
                        if (activeCategory && activeSubcategory) {
                            loadEntries(activeCategory.textContent, activeSubcategory.textContent).then(() => {
                                // Находим и выделяем обновленную запись
                                var editedLi = document.querySelector(`li[data-entry-id="${entryId}"]`);
                                if (editedLi) {
                                    editedLi.scrollIntoView({behavior: 'smooth', block: 'center'});
                                    editedLi.classList.add('selected');
                                }
                            });
                        } else {
                            console.log('Автообновление невозможно - выполняется перезагрузка');
                            location.reload();
                        }
                    }
                })
                .catch(error => console.error('Ошибка сохранения записи:', error));
        }

        function cancelEdit() {
            document.getElementById('edit_entry_form').style.display = 'none';
        }

        function openTab(tabName) {
            var tabcontent = document.getElementsByClassName("tab-content");
            for (var i = 0; i < tabcontent.length; i++) {
                tabcontent[i].style.display = "none";
            }
            document.getElementById(tabName).style.display = "block";
            var tabbuttons = document.getElementsByClassName("tab-button");
            for (var i = 0; i < tabbuttons.length; i++) {
                tabbuttons[i].classList.remove("active");
            }
            document.querySelector(`button[onclick="openTab('${tabName}')"]`).classList.add("active");
        }

        window.onload = function() {
            openTab('add');
            document.getElementById('add_category_select').addEventListener('change', updateAddSubcategories);
            document.getElementById('add_subcategory_select').addEventListener('change', function() {
                var newSubcategoryInput = document.getElementById('new_subcategory_input');
                newSubcategoryInput.style.display = this.value === '__new__' ? 'block' : 'none';
            });
        };
    
