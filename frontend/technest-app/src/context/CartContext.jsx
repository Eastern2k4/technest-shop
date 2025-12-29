import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useAuth } from './AuthContext.jsx'

const CartContext = createContext(null)
const CART_KEY = 'technest_cart_v1'

// Helper to get cart key for a user
const getCartKey = (userId) => {
  return userId ? `${CART_KEY}_u${userId}` : `${CART_KEY}_guest`
}

// Helper to load cart from localStorage
const loadCart = (key) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

// Helper to save cart to localStorage
const saveCart = (key, cart) => {
  try {
    localStorage.setItem(key, JSON.stringify(cart))
  } catch (err) {
    console.error('Failed to save cart:', err)
  }
}

export function CartProvider({ children }) {
  const { user } = useAuth()
  const currentUserId = user?.id ?? null

  // Track previous user ID to detect transitions
  const prevUserIdRef = useRef(null)
  // Track which cart we're currently showing (to prevent double-saving)
  const currentCartOwnerRef = useRef(null)
  // Flag to skip save on initial mount
  const isInitialMountRef = useRef(true)
  // Flag to prevent saving during user transitions
  const isTransitioningRef = useRef(false)
  // Ref to track current items (to avoid stale closures)
  const itemsRef = useRef({})

  // Initialize cart based on current user (if any)
  const [items, setItems] = useState(() => {
    const userId = (() => {
      try {
        const userStr = localStorage.getItem('tn_user')
        if (userStr) {
          const userData = JSON.parse(userStr)
          return userData?.id ?? null
        }
      } catch {
        // Ignore
      }
      return null
    })()

    const key = getCartKey(userId)
    const cart = loadCart(key)
    currentCartOwnerRef.current = userId
    prevUserIdRef.current = userId
    itemsRef.current = cart
    return cart
  })

  // Update ref whenever items change
  useEffect(() => {
    itemsRef.current = items
  }, [items])

  // Handle user changes (login/logout/switch)
  useEffect(() => {
    const prevUserId = prevUserIdRef.current

    // Skip on initial mount
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false
      prevUserIdRef.current = currentUserId
      return
    }

    // No change in user
    if (currentUserId === prevUserId) {
      return
    }

    // Set transitioning flag to prevent save effect from running
    isTransitioningRef.current = true

    // Save current cart before switching (use ref to get latest items)
    const prevCartKey = getCartKey(prevUserId)
    const currentCart = { ...itemsRef.current }
    
    // Load the appropriate cart for the new user state
    let newCart = {}

    if (currentUserId === null) {
      // Logging out: save user cart first, then load guest cart
      saveCart(prevCartKey, currentCart)
      newCart = loadCart(getCartKey(null))
    } else if (prevUserId === null) {
      // Logging in from guest: merge guest cart with user cart
      const guestCart = currentCart // current items are guest cart
      const userCart = loadCart(getCartKey(currentUserId))
      
      // Merge: user cart takes priority, add guest items
      newCart = { ...userCart }
      for (const [id, qty] of Object.entries(guestCart)) {
        newCart[id] = (newCart[id] || 0) + Number(qty)
      }
      
      // Save merged cart to user's cart and clear guest cart
      saveCart(getCartKey(currentUserId), newCart)
      saveCart(getCartKey(null), {})
    } else {
      // Switching users: save previous user's cart, then load new user's cart
      saveCart(prevCartKey, currentCart)
      newCart = loadCart(getCartKey(currentUserId))
    }

    // Update state and refs
    setItems(newCart)
    currentCartOwnerRef.current = currentUserId
    prevUserIdRef.current = currentUserId

    // Clear transitioning flag after state update completes
    // Use requestAnimationFrame to ensure state has updated
    requestAnimationFrame(() => {
      setTimeout(() => {
        isTransitioningRef.current = false
      }, 0)
    })
  }, [currentUserId]) // Only depend on currentUserId, not items

  // Save cart whenever items change (but only if we're showing the correct user's cart)
  useEffect(() => {
    if (isInitialMountRef.current || isTransitioningRef.current) {
      return
    }

    // Only save if the cart owner matches the current user
    if (currentCartOwnerRef.current === currentUserId) {
      const key = getCartKey(currentUserId)
      saveCart(key, items)
    }
  }, [items, currentUserId])

  // Các hành động với giỏ hàng
  const actions = useMemo(
    () => ({
      add(id, qty = 1) {
        setItems(prev => ({ ...prev, [id]: (prev[id] || 0) + qty }))
      },
      set(id, qty) {
        setItems(prev => {
          const p = { ...prev }
          if (qty <= 0) delete p[id]
          else p[id] = qty
          return p
        })
      },
      remove(id) {
        setItems(prev => {
          const p = { ...prev }
          delete p[id]
          return p
        })
      },
      clear() {
        setItems({})
      },
    }),
    []
  )

  const count = Object.values(items).reduce((a, b) => a + Number(b), 0)

  return (
    <CartContext.Provider value={{ items, count, ...actions }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
