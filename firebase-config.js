// firebaseConfig.js

// Importar SDKs de Firebase para la configuración y la base de datos (Firestore)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc 
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// --- TU CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyC4eWUlE97zDrTUEPgjQofsmalHd7gMpsE",
    authDomain: "oscar-7b7df.firebaseapp.com",
    projectId: "oscar-7b7df",
    storageBucket: "oscar-7b7df.firebasestorage.app",
    messagingSenderId: "871170729316",
    appId: "1:871170729316:web:be5918fc66135db9684671"
};

// Inicialización
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const ORDERS_COLLECTION = 'dtf_orders'; // Nombre de tu colección en Firestore

// ----------------------------------------------------
// --- FUNCIONES CRUD PARA MANEJAR PEDIDOS EN FIRESTORE ---
// ----------------------------------------------------

/**
 * Lee todos los pedidos de Firestore.
 */
async function getOrders() {
    try {
        const querySnapshot = await getDocs(collection(db, ORDERS_COLLECTION));
        const ordersList = querySnapshot.docs.map(doc => ({
            id: doc.id, // ID de Firestore para operaciones de actualización/borrado
            ...doc.data()
        }));
        return ordersList;
    } catch (error) {
        console.error("Error al leer pedidos de Firestore:", error);
        return [];
    }
}

/**
 * Crea un nuevo pedido en Firestore.
 */
async function addOrder(orderData) {
    try {
        const docRef = await addDoc(collection(db, ORDERS_COLLECTION), orderData);
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error al añadir pedido a Firestore:", error);
        return { success: false, error };
    }
}

/**
 * Actualiza el estado de un pedido (ej: 'delivered').
 */
async function updateOrderStatus(id, updateData) {
    try {
        const orderRef = doc(db, ORDERS_COLLECTION, id);
        await updateDoc(orderRef, updateData);
        return { success: true };
    } catch (error) {
        console.error("Error al actualizar estado en Firestore:", error);
        return { success: false, error };
    }
}

/**
 * Elimina un pedido de Firestore.
 */
async function deleteOrder(id) {
    try {
        const orderRef = doc(db, ORDERS_COLLECTION, id);
        await deleteDoc(orderRef);
        return { success: true };
    } catch (error) {
        console.error("Error al eliminar pedido de Firestore:", error);
        return { success: false, error };
    }
}

// ----------------------------------------------------
// --- EXPORTACIONES ---
// ----------------------------------------------------

export { 
    getOrders, 
    addOrder, 
    updateOrderStatus, 
    deleteOrder
};