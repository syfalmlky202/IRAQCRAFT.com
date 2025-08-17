// تهيئة Firebase باستخدام معلومات مشروعك
const firebaseConfig = {
  apiKey: "AIzaSyA5VT5g4cdpdA1ppiqXjAIa2O_C7YjxFkI",
  authDomain: "store-372e5.firebaseapp.com",
  databaseURL: "https://store-372e5-default-rtdb.firebaseio.com",
  projectId: "store-372e5",
  storageBucket: "store-372e5.firebasestorage.app",
  messagingSenderId: "1074162968634",
  appId: "1:1074162968634:web:d524667d50fba4967b6d03",
  measurementId: "G-M155D7N91P"
};

// بدء تشغيل Firebase وتحديد قاعدة بيانات Realtime Database
const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database();
firebase.analytics();

let cart = [];
const cartList = document.getElementById("cart-list");
const totalPriceElement = document.getElementById("total-price");
const cartBadge = document.getElementById("cart-badge");
const emptyCartMessage = document.getElementById("empty-cart-message");
const addSound = document.getElementById('add-sound');

// عناصر نافذة تفاصيل المنتج المنبثقة (Popup Modal Elements)
const itemDetailsModal = document.getElementById('item-details-modal');
const itemDetailsModalOverlay = document.getElementById('item-details-modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalImage = document.getElementById('modal-image');
const modalName = document.getElementById('modal-name');
const modalPrice = document.getElementById('modal-price');
const modalDescription = document.getElementById('modal-description');
const modalSpecificDetails = document.getElementById('modal-specific-details');
const addToCartModalBtn = document.getElementById('add-to-cart-from-modal');
let currentItemData = null; // لتخزين بيانات العنصر المعروض حاليًا في النافذة المنبثقة

// متغير عام لتخزين جميع المنتجات التي تم جلبها من Firebase
let allProducts = [];

// مراجع لأقسام عرض المنتجات في HTML
const productsContainer = document.getElementById('products-container');
const realmsSection = document.getElementById('realms-section');
const coinsSection = document.getElementById('coins-section');
const accountsSection = document.getElementById('accounts-section');
// أقسام جديدة
const ranksSection = document.getElementById('ranks-section');
const packsSection = document.getElementById('packs-section');
const serversSection = document.getElementById('servers-section');

// استبدل بـ اسم مستخدم تيليجرام ورقم واتساب الخاص بك
const telegramUsername = 'iq_CRAFT';
const whatsappNumber = '+9647781356002';


// عند تحميل الصفحة، نقوم بجلب المنتجات من Firebase أولاً
document.addEventListener('DOMContentLoaded', async () => {
  // تحميل محتويات السلة من الذاكرة المحلية للمتصفح
  loadCartFromLocalStorage();
  updateCartDisplay();
  updateCartBadge();
  setCurrentYear();

  // جلب المنتجات من Firebase عند اكتمال تحميل DOM
  await fetchProducts();

  // إعداد أزرار إتمام الطلب (تيليجرام وواتساب)
  document.getElementById('telegram-checkout').addEventListener('click', (e) => {
    e.preventDefault();
    sendOrderToTelegram();
  });
  document.getElementById('whatsapp-checkout').addEventListener('click', (e) => {
    e.preventDefault();
    sendOrderToWhatsApp();
  });
});

// تحديث السنة الحالية في التذييل
function setCurrentYear() {
  document.getElementById('current-year').textContent = new Date().getFullYear();
}

// تبديل إظهار وإخفاء القائمة الجانبية
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  sidebar.classList.toggle("active");
  overlay.classList.toggle("active");
  document.getElementById("sidebar-toggle").setAttribute("aria-expanded", sidebar.classList.contains("active"));
}

// تبديل إظهار وإخفاء سلة المشتريات
function toggleCart() {
  const cartDiv = document.getElementById("cart");
  const overlay = document.getElementById("cart-overlay");
  cartDiv.classList.toggle("active");
  overlay.classList.toggle("active");
  document.getElementById("cart-icon").setAttribute("aria-expanded", cartDiv.classList.contains("active"));
}

// --- وظائف التكامل مع Firebase Realtime Database ---

// دالة لجلب المنتجات من Realtime Database
async function fetchProducts() {
    try {
        const productsRef = database.ref('products');
        productsRef.once('value', (snapshot) => {
            const productsData = snapshot.val();
            allProducts = [];

            if (productsData) {
                for (const key in productsData) {
                    if (Object.hasOwnProperty.call(productsData, key)) {
                        allProducts.push({
                            id: key,
                            ...productsData[key]
                        });
                    }
                }
            }

            console.log("Products fetched from Realtime Database:", allProducts);
            displayProducts(allProducts);
            showSection('all-products');
        });
    } catch (error) {
        console.error("Error fetching products from Realtime Database:", error);
        showNotification("حدث خطأ أثناء جلب المنتجات. حاول مرة أخرى.", 'error');
    }
}

// دالة لعرض المنتجات ديناميكيًا في الأقسام الصحيحة
function displayProducts(productsToDisplay) {
    // مسح المنتجات الموجودة حاليًا من جميع الأقسام لتجنب التكرار
    productsContainer.innerHTML = '<h2 class="section-title">جميع المنتجات</h2>';
    realmsSection.innerHTML = '<h2 class="section-title">الريلمات</h2>';
    coinsSection.innerHTML = '<h2 class="section-title">الكوينزات</h2>';
    accountsSection.innerHTML = '<h2 class="section-title">الحسابات</h2>';
    // مسح الأقسام الجديدة
    ranksSection.innerHTML = '<h2 class="section-title">الرانكات</h2>';
    packsSection.innerHTML = '<h2 class="section-title">الحزم</h2>';
    serversSection.innerHTML = '<h2 class="section-title">السيرفرات</h2>';

    productsToDisplay.forEach(product => {
        // إنشاء كود HTML لكل منتج
        const itemHtml = `
            <div class="item"
                 data-id="${product.id}"
                 data-category="${product.category}"
                 data-name="${product.name}"
                 data-price="${product.price}"
                 data-image="${product.image}"
                 data-details="${product.details || ''}"
                 ${product.duration ? `data-duration="${product.duration}"` : ''}
                 ${product.players ? `data-players="${product.players}"` : ''}
                 ${product.features ? `data-features="${product.features}"` : ''}
                 ${product.coinAmount ? `data-coin-amount="${product.coinAmount}"` : ''}
                 ${product.game ? `data-game="${product.game}"` : ''}
                 ${product.accountType ? `data-account-type="${product.accountType}"` : ''}
                 ${product.rankType ? `data-rank-type="${product.rankType}"` : ''}
                 ${product.serverName ? `data-server-name="${product.serverName}"` : ''}
                 ${product.packContents ? `data-pack-contents="${product.packContents}"` : ''}
                 data-available="${product.available}">
                <span class="stamp ${product.available ? 'available' : 'unavailable'}">
                    ${product.available ? 'متوفر' : 'غير متوفر'}
                </span>
                <img src="${product.image}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>السعر: $${parseFloat(product.price).toFixed(2)}</p>
                <button ${product.available ? '' : 'class="disabled" disabled'} onclick="addToCart(this); event.stopPropagation();">
                    ${product.available ? 'إضافة للسلة' : 'غير متوفر'}
                </button>
            </div>
        `;

        // إضافة المنتج إلى قسم "جميع المنتجات"
        productsContainer.insertAdjacentHTML('beforeend', itemHtml);

        // إضافة المنتج إلى أقسام الفئات المحددة
        if (product.category === 'realms') {
            realmsSection.insertAdjacentHTML('beforeend', itemHtml);
        } else if (product.category === 'coins') {
            coinsSection.insertAdjacentHTML('beforeend', itemHtml);
        } else if (product.category === 'accounts') {
            accountsSection.insertAdjacentHTML('beforeend', itemHtml);
        } else if (product.category === 'ranks') { // فئة جديدة
            ranksSection.insertAdjacentHTML('beforeend', itemHtml);
        } else if (product.category === 'packs') { // فئة جديدة
            packsSection.insertAdjacentHTML('beforeend', itemHtml);
        } else if (product.category === 'servers') { // فئة جديدة
            serversSection.insertAdjacentHTML('beforeend', itemHtml);
        }
    });

    // إضافة مستمع حدث النقر لفتح نافذة التفاصيل لكل عنصر منتج تم إنشاؤه حديثًا
    document.querySelectorAll('.item').forEach(item => {
        item.addEventListener('click', function(event) {
            if (event.target.tagName !== 'BUTTON') {
                showItemDetails(this);
            }
        });
    });
}

// --- نهاية وظائف التكامل مع Firebase Realtime Database ---

// إضافة منتج إلى السلة
function addToCart(buttonElement) {
  const itemElement = buttonElement.closest('.item');
  const id = itemElement.dataset.id;
  const name = itemElement.dataset.name;
  const price = parseFloat(itemElement.dataset.price);
  const image = itemElement.dataset.image;

  const existingItemIndex = cart.findIndex(item => item.id === id);

  if (existingItemIndex > -1) {
    cart[existingItemIndex].quantity++;
  } else {
    cart.push({ id, name, price, image, quantity: 1 });
  }

  saveCartToLocalStorage();
  updateCartDisplay();
  updateCartBadge();

  if (addSound) {
    addSound.currentTime = 0;
    addSound.play().catch(e => console.error("Audio play failed:", e));
  }

  buttonElement.classList.add('added-animation');
  setTimeout(() => buttonElement.classList.remove('added-animation'), 400);

  showNotification(`${name} تم إضافته إلى السلة!`);
}

// إضافة منتج إلى السلة من نافذة التفاصيل المنبثقة
function addToCartFromModal() {
    if (!currentItemData) return;

    const id = currentItemData.id;
    const name = currentItemData.name;
    const price = parseFloat(currentItemData.price);
    const image = currentItemData.image;

    const existingItemIndex = cart.findIndex(item => item.id === id);

    if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity++;
    } else {
        cart.push({ id, name, price, image, quantity: 1 });
    }

    saveCartToLocalStorage();
    updateCartDisplay();
    updateCartBadge();

    if (addSound) {
        addSound.currentTime = 0;
        addSound.play().catch(e => console.error("Audio play failed:", e));
    }
    showNotification(`${name} تم إضافته إلى السلة!`);
    closeItemDetails();
}

// تحديث شارة عدد المنتجات في السلة
function updateCartBadge() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartBadge.textContent = totalItems;
  cartBadge.classList.toggle('hidden', totalItems === 0);
}

// تحديث عرض المنتجات في السلة
function updateCartDisplay() {
  if (cart.length === 0) {
    emptyCartMessage.style.display = 'block';
    cartList.innerHTML = '';
  } else {
    emptyCartMessage.style.display = 'none';
    cartList.innerHTML = cart.map((item, index) => `
      <li class="cart-item" data-index="${index}">
        <span>${item.name} (${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}</span>
        <div class="quantity-controls">
          <button onclick="changeQuantity(${index}, -1)" aria-label="تقليل الكمية"><i class="fas fa-minus"></i></button>
          <span>${item.quantity}</span>
          <button onclick="changeQuantity(${index}, 1)" aria-label="زيادة الكمية"><i class="fas fa-plus"></i></button>
        </div>
        <button class="remove-btn" onclick="removeFromCart(${index})" aria-label="إزالة العنصر">
          <i class="fas fa-times"></i>
        </button>
      </li>
    `).join('');
  }

  const total = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  totalPriceElement.textContent = `المجموع: $${total.toFixed(2)}`;
}

// تغيير كمية المنتج في السلة
function changeQuantity(index, delta) {
  if (cart[index]) {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) {
      removeFromCart(index);
    } else {
      saveCartToLocalStorage();
      updateCartDisplay();
      updateCartBadge();
    }
  }
}

// إزالة منتج من السلة
function removeFromCart(index) {
  cart.splice(index, 1);
  saveCartToLocalStorage();
  updateCartDisplay();
  updateCartBadge();
}

// حفظ السلة في الذاكرة المحلية للمتصفح (LocalStorage)
function saveCartToLocalStorage() {
  localStorage.setItem('shoppingCart', JSON.stringify(cart));
}

// تحميل السلة من الذاكرة المحلية للمتصفح (LocalStorage)
function loadCartFromLocalStorage() {
  const storedCart = localStorage.getItem('shoppingCart');
  if (storedCart) {
    cart = JSON.parse(storedCart);
  }
}

// إظهار القسم المحدد من المنتجات
function showSection(id) {
    document.querySelectorAll('.section').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });

    let activeSection;
    // تحديد القسم النشط بناءً على الـ ID
    if (id === 'all-products') {
        activeSection = productsContainer;
    } else if (id === 'realms') {
        activeSection = realmsSection;
    } else if (id === 'coins') {
        activeSection = coinsSection;
    } else if (id === 'accounts') {
        activeSection = accountsSection;
    } else if (id === 'ranks') { // فئة جديدة
        activeSection = ranksSection;
    } else if (id === 'packs') { // فئة جديدة
        activeSection = packsSection;
    } else if (id === 'servers') { // فئة جديدة
        activeSection = serversSection;
    } else {
        return;
    }

    if (activeSection) {
        activeSection.style.display = 'flex';
        setTimeout(() => activeSection.classList.add('active'), 10);

        const sectionTitle = activeSection.querySelector('.section-title');
        if (sectionTitle) {
            sectionTitle.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}

// إظهار إشعارات للمستخدم
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background-color: ${type === 'success' ? 'var(--primary-color)' : 'var(--red-alert)'};
    color: ${type === 'success' ? 'var(--dark-bg)' : 'var(--text-color)'};
    padding: 12px 20px;
    border-radius: var(--border-radius-md);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.4);
    font-size: 1em;
    z-index: 2000;
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.4s ease-out, transform 0.4s ease-out;
    font-family: 'Tajawal', sans-serif;
  `;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateY(0)';
  }, 50);

  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(20px)';
    notification.addEventListener('transitionend', () => notification.remove());
  }, 3000);
}

// إنشاء رسالة الطلب للتيليجرام والواتساب
function generateOrderMessage() {
  if (cart.length === 0) {
    return "مرحباً! أود الاستفسار عن المنتجات في متجركم.";
  }

  let message = "مرحباً! أود إتمام طلب للمنتجات التالية:\n\n";
  cart.forEach((item, index) => {
    message += `${index + 1}. ${item.name} - الكمية: ${item.quantity} - السعر: $${(item.price * item.quantity).toFixed(2)}\n`;
  });
  message += `\nالمجموع الكلي: $${cart.reduce((sum, i) => sum + (i.price * i.quantity), 0).toFixed(2)}\n\n`;
  message += "الرجاء تزويدي بتفاصيل الدفع وإتمام الطلب. شكراً!";
  return encodeURIComponent(message);
}

// إرسال الطلب عبر تيليجرام
function sendOrderToTelegram() {
  const message = generateOrderMessage();
  const telegramUrl = `https://t.me/${telegramUsername}?text=${message}`;
  window.open(telegramUrl, '_blank');
}

// إرسال الطلب عبر واتساب
function sendOrderToWhatsApp() {
  const message = generateOrderMessage();
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
  window.open(whatsappUrl, '_blank');
}

// --- وظائف نافذة تفاصيل المنتج المنبثقة ---

// إظهار نافذة تفاصيل المنتج
function showItemDetails(itemElement) {
    const productId = itemElement.dataset.id;
    currentItemData = allProducts.find(p => p.id === productId);

    if (!currentItemData) {
        console.error("Product data not found for ID:", productId);
        return;
    }

    modalTitle.textContent = currentItemData.name;
    modalImage.src = currentItemData.image;
    modalImage.alt = currentItemData.name;
    modalName.textContent = currentItemData.name;
    modalPrice.textContent = `$${parseFloat(currentItemData.price).toFixed(2)}`;
    modalDescription.textContent = currentItemData.details || 'لا يوجد وصف متاح لهذا المنتج.';

    modalSpecificDetails.innerHTML = ''; // مسح التفاصيل السابقة

    // إضافة تفاصيل خاصة بناءً على فئة المنتج
    if (currentItemData.category === 'realms') {
        modalSpecificDetails.innerHTML += `
            <p><i class="fas fa-clock"></i> <strong>المدة:</strong> <span>${currentItemData.duration || 'غير محدد'}</span></p>
            <p><i class="fas fa-users"></i> <strong>عدد اللاعبين:</strong> <span>${currentItemData.players || 'غير محدد'}</span></p>
            <p><i class="fas fa-gear"></i> <strong>ميزات إضافية:</strong> <span>${currentItemData.features || 'لا يوجد'}</span></p>
        `;
    } else if (currentItemData.category === 'coins') {
        modalSpecificDetails.innerHTML += `
            <p><i class="fas fa-coins"></i> <strong>الكمية:</strong> <span>${currentItemData.coinAmount || 'غير محدد'}</span></p>
            <p><i class="fas fa-gamepad"></i> <strong>اللعبة:</strong> <span>${currentItemData.game || 'غير محدد'}</span></p>
        `;
    } else if (currentItemData.category === 'accounts') {
        modalSpecificDetails.innerHTML += `
            <p><i class="fas fa-tag"></i> <strong>نوع الحساب:</strong> <span>${currentItemData.accountType || 'غير محدد'}</span></p>
            <p><i class="fas fa-list-check"></i> <strong>الميزات:</strong> <span>${currentItemData.features || 'لا يوجد'}</span></p>
        `;
    } else if (currentItemData.category === 'ranks') { // تفاصيل الرانكات
        modalSpecificDetails.innerHTML += `
            <p><i class="fas fa-star"></i> <strong>نوع الرانك:</strong> <span>${currentItemData.rankType || 'غير محدد'}</span></p>
            <p><i class="fas fa-circle-info"></i> <strong>الفوائد:</strong> <span>${currentItemData.benefits || 'لا يوجد'}</span></p>
        `;
    } else if (currentItemData.category === 'packs') { // تفاصيل الحزم
        modalSpecificDetails.innerHTML += `
            <p><i class="fas fa-box"></i> <strong>محتويات الحزمة:</strong> <span>${currentItemData.packContents || 'غير محدد'}</span></p>
            <p><i class="fas fa-layer-group"></i> <strong>الفئة:</strong> <span>${currentItemData.packCategory || 'غير محدد'}</span></p>
        `;
    } else if (currentItemData.category === 'servers') { // تفاصيل السيرفرات
        modalSpecificDetails.innerHTML += `
            <p><i class="fas fa-network-wired"></i> <strong>اسم السيرفر:</strong> <span>${currentItemData.serverName || 'غير محدد'}</span></p>
            <p><i class="fas fa-globe"></i> <strong>نوع السيرفر:</strong> <span>${currentItemData.serverType || 'غير محدد'}</span></p>
            <p><i class="fas fa-users-line"></i> <strong>سعة اللاعبين:</strong> <span>${currentItemData.maxPlayers || 'غير محدد'}</span></p>
        `;
    }

    const isAvailable = currentItemData.available;
    if (isAvailable) {
        addToCartModalBtn.classList.remove('disabled');
        addToCartModalBtn.disabled = false;
        addToCartModalBtn.textContent = 'إضافة للسلة';
    } else {
        addToCartModalBtn.classList.add('disabled');
        addToCartModalBtn.disabled = true;
        addToCartModalBtn.textContent = 'غير متوفر';
    }

    itemDetailsModal.classList.add('active');
    itemDetailsModalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// إغلاق نافذة تفاصيل المنتج
function closeItemDetails() {
    itemDetailsModal.classList.remove('active');
    itemDetailsModalOverlay.classList.remove('active');
    document.body.style.overflow = '';
    currentItemData = null;
}
