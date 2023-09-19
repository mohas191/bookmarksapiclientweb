//<span class="cmdIcon fa-solid fa-ellipsis-vertical"></span>
let contentScrollPosition = 0;
let _category = "";
function refreshCategoryList(){
    console.log(getCategory());
    
    $(".gcclickable").each(function(e){
        let childs = $(this).find(".menuIconFA")
        childs.removeClass("menuIcon");
        childs.addClass("menuIconWhite");
        let isSet = false;
        if($(this).attr("gcclick") == getCategory()){
            childs.removeClass("menuIconWhite");
            childs.addClass("menuIcon");
            isSet = true;
        }
        //console.log($(this).attr("gcclick")  + " / "+ getCategory() + " / isSet: "+isSet);
    });
    // if($(".gcclickable").attr("gcclick") == getCategory()){
    //     let childs = $(".gcclickable[gcclick='"+getCategory()+"']").find(".menuIconFA");
    //     childs.removeClass("menuIconWhite");
    //     childs.addClass("menuIcon");
    //     isSet = true;
    // }
}
let setCategory = function(val){
    _category = val;
    refreshCategoryList();
    setTimeout(function(){
        renderContacts();
    },200)
}
let getCategory = function(){return _category;}
Init_UI();
function Init_UI() {
    renderContacts();
    $('#createContact').on("click", async function () {
        saveContentScrollPosition();
        renderCreateContactForm();
    });
    $('#abort').on("click", async function () {
        renderContacts();
        renderCategoriesList();
    });
    $('#aboutCmd').on("click", function () {
        renderAbout();
        renderCategoriesList();
    });
    renderCategoriesList();
}

async function renderCategoriesList(){
    let categoryes = await Contacts_API.getCategoriesJSON();
    //console.log(categoryes);
    $("#generatedCategories").empty();
    categoryes.forEach(e => {
        $("#generatedCategories").append($(`
        <div class="dropdown-item gcclickable" id="loginCmdX" gcclick="${e}">
            <i class="menuIconWhite menuIconFA fa fa-check mx-2"></i>
            ${e}
        </div>
        `));
    })

    $(".gcclickable").on("click",function(e){
        //console.log(e);
        let val = $(this).attr("gcclick");
        setCategory(val);
        //console.log(val);
    });
}

function renderAbout() {
    saveContentScrollPosition();
    eraseContent();
    $("#createContact").hide();
    $("#abort").show();
    $("#actionTitle").text("À propos...");
    $("#content").append(
        $(`
            <div class="aboutContainer">
                <h2>Gestionnaire de contacts</h2>
                <hr>
                <p>
                    Petite application de gestion de favoris/bookmarks à titre de démonstration
                    d'interface utilisateur monopage réactive. (LABO 1)
                </p>
                <p>
                    Modificateur pour cette adaptation: Mohammed Ibnou Zahir <br>
                    Auteur Originale: Nicolas Chourot
                </p>
                <p>
                    Collège Lionel-Groulx, automne 2023
                </p>
            </div>
        `))
}
async function renderContacts() {
    showWaitingGif();
    $("#actionTitle").text("Liste des favoris");
    $("#createContact").show();
    $("#abort").hide();
    let contacts;
    if (getCategory() == ""){
        contacts = await Contacts_API.Get();
    } else{ contacts = await Contacts_API.GetByCategory(null,getCategory()) }
    eraseContent();
    if (contacts !== null) {
        contacts.forEach(contact => {
            $("#content").append(renderContact(contact));
        });
        restoreContentScrollPosition();
        // Attached click events on command icons
        $(".editCmd").on("click", function () {
            saveContentScrollPosition();
            renderEditContactForm(parseInt($(this).attr("editContactId")));
        });
        $(".deleteCmd").on("click", function () {
            saveContentScrollPosition();
            renderDeleteContactForm(parseInt($(this).attr("deleteContactId")));
        });
        $(".contactRow").on("click", function (e) { e.preventDefault(); })
    } else {
        renderError("Service introuvable");
    }
    refreshCategoryList();
}
function showWaitingGif() {
    $("#content").empty();
    $("#content").append($("<div class='waitingGifcontainer'><img class='waitingGif' src='Loading_icon.gif' /></div>'"));
}
function eraseContent() {
    $("#content").empty();
    //renderCategoriesList();
    refreshCategoryList();
}
function saveContentScrollPosition() {
    contentScrollPosition = $("#content")[0].scrollTop;
}
function restoreContentScrollPosition() {
    $("#content")[0].scrollTop = contentScrollPosition;
}
function renderError(message) {
    eraseContent();
    $("#content").append(
        $(`
            <div class="errorContainer">
                ${message}
            </div>
        `)
    );
}
function renderCreateContactForm() {
    renderContactForm();
}
async function renderEditContactForm(id) {
    showWaitingGif();
    let contact = await Contacts_API.Get(id);
    if (contact !== null)
        renderContactForm(contact);
    else
        renderError("Favoris introuvable!");
}
async function renderDeleteContactForm(id) {
    showWaitingGif();
    $("#createContact").hide();
    $("#abort").show();
    $("#actionTitle").text("Retrait");
    let contact = await Contacts_API.Get(id);
    eraseContent();
    if (contact !== null) {
        $("#content").append(`
        <div class="contactdeleteForm">
            <h4>Effacer le favoris suivant?</h4>
            <br>
            <div class="contactRow" contact_id=${contact.Id}">
                <div class="contactContainer">
                    <div class="separate2">
                ${getContentImage(contact)}
                <div class="contactLayout">
                    <span class="contactName">${contact.Name}</span>
                    <span class="contactName">${getUrlSansHttp(contact.Url)}</span>
                    <span class="contactEmail" style="display:none;">${contact.Email}</span>
                </div>
            </div>
                </div>  
            </div>   
            <br>
            <input type="button" value="Effacer" id="deleteContact" class="btn btn-primary">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
        </div>    
        `);
        $('#deleteContact').on("click", async function () {
            showWaitingGif();
            let result = await Contacts_API.Delete(contact.Id);
            renderCategoriesList();
            setCategory("");
            if (result)
                renderContacts();
            else
                renderError("Une erreur est survenue!");
        });
        $('#cancel').on("click", function () {
            renderContacts();
        });
    } else {
        renderError("Contact introuvable!");
    }
}
function newContact() {
    contact = {};
    contact.Id = 0;
    contact.Name = "";
    contact.Url = "";
    contact.CategoryString = "";
    //contact.ImgUrl = "";
    return contact;
}
function renderContactForm(contact = null) {
    $("#createContact").hide();
    $("#abort").show();
    eraseContent();
    let create = contact == null;
    if (create) contact = newContact();
    $("#actionTitle").text(create ? "Création" : "Modification");
    $("#content").append(`
        <form class="form" id="contactForm">
            <input type="hidden" name="Id" value="${contact.Id}"/>

            <label for="Name" class="form-label">Nom </label>
            <input 
                class="form-control Alpha"
                name="Name" 
                id="Name" 
                placeholder="Nom"
                required
                RequireMessage="Veuillez entrer un nom"
                InvalidMessage="Le nom comporte un caractère illégal" 
                value="${contact.Name}"
            />
            <label for="CategoryString" class="form-label">Catégorie de favoris </label>
            <input 
                class="form-control Alpha"
                name="CategoryString" 
                id="CategoryString" 
                placeholder="Catégorie"
                required
                RequireMessage="Veuillez entrer une catégorie"
                InvalidMessage="La catégorie comporte un caractère illégal" 
                value="${contact.CategoryString}"
            />
            <label for="Phone" class="form-label">URL du favoris </label>
            <input
                class="form-control URL"
                name="Url"
                id="Url"
                placeholder="www.example.com"
                required
                RequireMessage="Veuillez entrer l'url" 
                InvalidMessage="Veuillez entrer un url valide"
                value="${contact.Url}" 
            />
            <hr>
            <input type="submit" value="Enregistrer" id="saveContact" class="btn btn-primary">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
        </form>
    `);
    initFormValidation();
    $('#contactForm').on("submit", async function (event) {
        event.preventDefault();
        let contact = getFormData($("#contactForm"));
        contact.Id = parseInt(contact.Id);
        showWaitingGif();
        let result = await Contacts_API.Save(contact, create);
        renderCategoriesList();
        if (result)
            renderContacts();
        else
            renderError("Une erreur est survenue!");
    });
    $('#cancel').on("click", function () {
        renderContacts();
    });
}

function getFormData($form) {
    const removeTag = new RegExp("(<[a-zA-Z0-9]+>)|(</[a-zA-Z0-9]+>)", "g");
    var jsonObject = {};
    $.each($form.serializeArray(), (index, control) => {
        jsonObject[control.name] = control.value.replace(removeTag, "");
    });
    return jsonObject;
}
function getUrlSansHttp(url){
    //return url.replace(/(^\w+:|^)\/|\/$/g, ''); //https://stackoverflow.com/questions/8206269/how-to-remove-http-from-a-url-in-javascript;
    var result //https://stackoverflow.com/questions/34818020/javascript-regex-url-extract-domain-only
    var match
    if (match = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n\?\=]+)/im)) {
        result = match[1]
        if (match = result.match(/^[^\.]+\.(.+\..+)$/)) {
            result = match[1]
        }
    }
    return result;
}

function getContentImage(contact){
    let urlSansHttp = contact.Url; //getUrlSansHttp(contact.Url);
    return (`
    <div class="bookmarkicon"><img src="https://www.google.com/s2/favicons?domain=${urlSansHttp}&sz=256"></div>
    `);
}

function renderContact(contact) {
    return $(`
     <div class="contactRow" contact_id=${contact.Id}">
        <div class="contactContainer noselect">
            <div class="separate2">
                ${getContentImage(contact)}
                <div class="contactLayout">
                    <span class="contactName">${contact.Name}</span>
                    <span class="contactName">${getUrlSansHttp(contact.Url)}</span>
                    <span class="contactEmail" style="display:none;">${contact.Email}</span>
                </div>
            </div>
            <div class="separate2vertical"> 
            <div class="contactCommandPanel">
                <span class="editCmd cmdIcon fa fa-pencil" editContactId="${contact.Id}" title="Modifier ${contact.Name}"></span>
                <span class="deleteCmd cmdIcon fa fa-trash" deleteContactId="${contact.Id}" title="Effacer ${contact.Name}"></span>
            
            <div class="cmdIconText" style="display:block;">
                <span class="">${contact.CategoryString}</span>
            </div>
            </div>
        </div>
    </div>           
    `);
}