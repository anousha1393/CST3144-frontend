new Vue({
  el: '#app',
  data: {
    sitename: 'Learn Lounge',
    sortAttribute: 'subject',
    sortOrder: 'asc',
    showCart: false,
    activeSection: 'personalDetails', // Keeps track of the currently open section
    error: null, // Error message for validation
    name: '',  
    phone: '',
    lessons: [],
    searchQuery: '', // New property for search input
    modalVisible: false, // Controls whether the modal is shown
    modalMessage: '', // The message to display in the modal
    modalTitle: '', // Allows dynamic titles
    errorMessage: '', // New property for error messages
    cart: [],
    nameError: false,
    phoneError: false,
    couponCode: '',
    discountRate: 0, // discount percentage based on coupon
    teams: [
      {
        id: 1,
        name: 'Hisham Junaid',
        role: 'CEO & Founder',
        bio: 'Hisham is passionate about education and believes that every child deserves access to quality extracurricular activities.',
        image: '../images/boy.png'
      },
      {
        id: 2,
        name: 'Anousha Tariq',
        role: 'Developer',
        bio: 'Anousha loves building cool and innovative web applications.',
        image: '../images/girl.jfif'
      }
    ]
  },
  computed: {
    sortedLessons() {
      return this.lessons.slice().sort((a, b) => {
        let result = 0;

        if (typeof a[this.sortAttribute] === 'string') {
          result = a[this.sortAttribute].localeCompare(b[this.sortAttribute]);
        } else {
          result = a[this.sortAttribute] - b[this.sortAttribute];
        }

        return this.sortOrder === 'asc' ? result : -result;
      });
    },
    subtotal() {
      return this.cart.reduce((total, item) => total + item.price * item.quantity, 0);
    },
    discount() {
      return this.subtotal * (this.discountRate / 100);
    },
    tax() {
      const TAX_RATE = 10; // for example, 10%
      return (this.subtotal - this.discount) * (TAX_RATE / 100);
    },
    finalTotal() {
      return this.subtotal - this.discount + this.tax;
    },
    isCheckoutValid() {
      // Ensure both name and phone are valid before enabling checkout button
      return this.name && !this.nameError && this.phone && !this.phoneError;
    }
  },
  async mounted() {
    console.log("Fetching lessons..."); // Make sure the fetch is triggered
    await this.fetchLessons();
  },
  methods: {
    toggleSortOrder() {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    },
    showModal(title, message) {
      this.modalTitle = title;
      this.modalMessage = message;
      this.modalVisible = true;
    },
    closeModal() {
      this.modalVisible = false;
      this.modalMessage = '';
    },
    async updateLessonSpaces(lessonId, newSpaces) {
      try {
        const response = await fetch(`https://cst3144-backend-application.onrender.com/M00908970/lessons/${lessonId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ spaces: newSpaces }), // Send updated spaces to server
        });
  
        if (!response.ok) {
          throw new Error('Failed to update lesson');
        }
  
        const data = await response.json();
        this.showModal('Successfull',data.message);  // Show success message
        this.fetchLessons();  // Re-fetch lessons to update the list
      } catch (error) {
        console.error('Error updating lesson:', error);
        this.showModal('Unsuccessfull','An error occurred while updating the lesson.');
      }
    },
    async fetchLessons() {
      try {
        const response = await fetch('https://cst3144-backend-application.onrender.com/M00908970/lessons');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log(data);  // Log the response data
        this.lessons = data;  // Assign to lessons data
      } catch (error) {
        console.error('Error fetching lessons:', error);
      }
    },
    async searchLessons() {
      try {
        const response = await fetch(
          `https://cst3144-backend-application.onrender.com/M00908970/search?q=${encodeURIComponent(this.searchQuery)}`
        );
    
        if (!response.ok) {
          throw new Error(`Search failed with status: ${response.status}`);
        }
    
        const data = await response.json();
    
        if (data.length === 0) {
          this.errorMessage = 'No results found.';
        } else {
          this.errorMessage = ''; // Clear the error message
        }
    
        this.lessons = data; // Update lessons with search results
    
      } catch (error) {
        console.error('Error fetching search results:', error);
        this.errorMessage = 'Something went wrong. Please try again later.';
      }
    },
    bookLesson(lesson) {
      if (lesson.spaces > 0) {
        // Find the lesson in the cart
        const cartItem = this.cart.find(item => item.id === lesson.id);
    
        if (cartItem) {
          // If the lesson is already in the cart, increment the quantity
          cartItem.quantity++;
        } else {
          // If the lesson is not in the cart, add it with a quantity of 1
          this.cart.push({ ...lesson, quantity: 1 });
        }
        // Deduct one space
        lesson.spaces--;
        this.showModal('Successfull',`You have successfully added ${lesson.subject} to your cart!`);
        console.log(this.cart);
      } else {
        this.showModal('Unsuccessfull','No more spaces available for this lesson.');
      }
    },
    removeFromCart(index) {
      let lesson = this.cart[index];
    
      if (lesson.quantity > 1) {
        // Decrease the quantity
        lesson.quantity--;
      } else {
        // Remove the item from the cart
        this.cart.splice(index, 1);
      }
    
      // Return space to the lesson
      const originalLesson = this.lessons.find(item => item.id === lesson.id);
      if (originalLesson) {
        originalLesson.spaces++;
      }
    
      // If cart is empty after removal, return to lessons view
      if (this.cart.length === 0) {
        this.showCart = false;
      }
    },
    toggleCart() {
      this.showCart = !this.showCart; // Switch between lessons and cart views
    },
    applyCoupon() {
      if (this.couponCode === 'SAVE10') {
        this.discountRate = 10;
        this.showModal('Successfull','Coupon applied! You got 10% off.');
      } else {
        this.discountRate = 0;
        this.showModal('Unsuccessfull','Invalid coupon code.');
      }
    },
    validateName() {
      const nameRegex = /^[A-Za-z\s]+$/;
      this.nameError = !nameRegex.test(this.name);
    },
    validatePhone() {
      const phoneRegex = /^[0-9]+$/;
      this.phoneError = !phoneRegex.test(this.phone);
    },
    submitOrder() {
      if (this.isCheckoutValid) {
        // Prepare the order object
        const order = {
          lessons: this.cart,        // Cart items
          name: this.name,           // Customer's name
          phone: this.phone,         // Customer's phone number
          totalAmount: this.finalTotal, // Total amount after coupon and tax
          coupon: this.couponCode,   // Applied coupon
        };
    
        // Send the order to the backend via POST request
        fetch('https://cst3144-backend-application.onrender.com/M00908970/order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(order), // Convert the order object to JSON
        })
          .then(response => response.json())
          .then(async (data) => {
            if (data.message) {
              this.showModal('Successfull', data.message);// Show success message
              console.log('Order Data:', data); // Log the saved order details
    
              // Update available spaces for each lesson in the database
              for (const lesson of this.lessons) {
                try {
                  const response = await fetch(`https://cst3144-backend-application.onrender.com/M00908970/lessons/${lesson._id}`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ spaces: lesson.spaces }), // Send updated spaces
                  });
    
                  if (!response.ok) {
                    console.error(`Failed to update lesson ${lesson.subject}: ${response.statusText}`);
                  } else {
                    console.log(`Lesson ${lesson.subject} spaces ${lesson.spaces} updated successfully`);
                  }
                } catch (error) {
                  console.error(`Error updating lesson ${lesson.subject}:`, error);
                }
              }
    
              // Clear the cart or redirect to a confirmation page here
              this.cart = [];  // Clear the cart after successful submission
              this.showCart = false;  // Hide cart
              this.name = '';  // Clear name
              this.phone = ''; // Clear phone
              this.couponCode = ''; // Clear coupon code
              await this.fetchLessons(); // Fetch updated lessons
            } else {
              this.showModal('Unsuccessfull','Failed to submit order');
            }
          })
          .catch(error => {
            console.error('Error submitting order:', error);
            this.showModal('Unsuccessfull','An error occurred while submitting the order');
          });
      }
    }
  },
  async mounted() {
    await this.fetchLessons(); // Load all lessons on initial mount
  }
});
