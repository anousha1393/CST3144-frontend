new Vue({ // Vue instance
  el: '#app', // Connects the Vue instance to the HTML element with the ID 'app'
  data: {
    sitename: 'Learn Lounge', // The name of the platform or website
    sortAttribute: 'subject', // Determines which attribute to sort lessons by
    sortOrder: 'asc', // Sets the default sort order (ascending)
    showCart: false, // Controls the visibility of the shopping cart
    activeSection: 'personalDetails', // Keeps track of the currently open section
    error: null, // Error message for validation
    name: '',   // Stores the user's name input
    phone: '', // Stores the user's phone number input
    lessons: [], // An array to store lesson data, fetched from an API
    searchQuery: '', // New property for search input
    modalVisible: false, // Controls whether the modal is shown
    modalMessage: '', // The message to display in the modal
    modalTitle: '', // Allows dynamic titles
    errorMessage: '', // New property for error messages
    cart: [],   // Holds the items (lessons) that the user adds to the cart
    nameError: false,    // Boolean flag to indicate a validation error in the name field
    phoneError: false,    // Boolean flag to indicate a validation error in the phone field
    couponCode: '',     // Stores the user's entered coupon code for discounts
    discountRate: 0, // discount percentage based on coupon
    teams: [   // Array of team member objects for display on the website
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
  computed: {  // Computes a sorted array of lessons based on the selected attribute and order
    sortedLessons() {
      return this.lessons.slice().sort((a, b) => {
        let result = 0;

        // If the sort attribute is a string, use localeCompare for proper string comparison
        if (typeof a[this.sortAttribute] === 'string') {
          result = a[this.sortAttribute].localeCompare(b[this.sortAttribute]);
        } else {   // If the sort attribute is a number, directly calculate the difference
          result = a[this.sortAttribute] - b[this.sortAttribute];
        }
        // Return the result based on the selected sort order (ascending or descending)
        return this.sortOrder === 'asc' ? result : -result;
      });
    },
    // Calculates the subtotal for items in the cart
    subtotal() {
      return this.cart.reduce((total, item) => total + item.price * item.quantity, 0);
    },
    // Calculates the discount amount based on the current discount rate
    discount() {
      return this.subtotal * (this.discountRate / 100);
    },
    // Calculates the tax based on the subtotal minus the discount
    tax() {
      const TAX_RATE = 10; // for example, 10%
      return (this.subtotal - this.discount) * (TAX_RATE / 100);
    },
    // Computes the final total, considering subtotal, discount, and tax
    finalTotal() {
      return this.subtotal - this.discount + this.tax;
    },
    // Validates if the checkout process can proceed based on user input
    isCheckoutValid() {
      // Ensure both name and phone are valid before enabling checkout button
      return this.name && !this.nameError && this.phone && !this.phoneError;
    }
  },
  // Vue instance is mounted to the DOM
  async mounted() {
    // Log a message to indicate lessons are being fetched
    console.log("Fetching lessons..."); 
    // Fetch lessons asynchronously, from an API and populate the lessons array
    await this.fetchLessons();
  },
  methods: { 
    // Toggles the sorting order between ascending and descending
    toggleSortOrder() {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    },
    // Displays a modal with a given title and message
    showModal(title, message) {
      this.modalTitle = title; // Set the modal title
      this.modalMessage = message; // Set the modal message
      this.modalVisible = true; // Show the modal
    },
    // Hides the modal and clears its message
    closeModal() {
      this.modalVisible = false; // Hide the modal
      this.modalMessage = ''; // Clear the message
    },
    // Updates the available spaces for a lesson on the server
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
    // Fetches the list of lessons from the server
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
    // Searches lessons based on the search query
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
          this.errorMessage = 'No results found.'; // Show message if no results are found
        } else {
          this.errorMessage = ''; // Clear the error message
        }
    
        this.lessons = data; // Update lessons with search results
    
      } catch (error) {
        console.error('Error fetching search results:', error);
        this.errorMessage = 'Something went wrong. Please try again later.';
      }
    },
    // Adds a lesson to the cart if spaces are available
    bookLesson(lesson) {
      if (lesson.spaces > 0) {
        // Find the lesson in the cart
        const cartItem = this.cart.find(item => item.id === lesson.id);
    
        if (cartItem) {
          // If the lesson is already in the cart, increment the quantity  // Increase the quantity if already in the cart
          cartItem.quantity++;
        } else {
          // If the lesson is not in the cart, add it with a quantity of 1
          this.cart.push({ ...lesson, quantity: 1 });  // Add lesson to the cart
        }
        // Deduct one space
        lesson.spaces--;
        this.showModal('Successfull',`You have successfully added ${lesson.subject} to your cart!`);
        console.log(this.cart);
      } else {
        this.showModal('Unsuccessfull','No more spaces available for this lesson.');
      }
    },
    // Removes an item from the cart and updates spaces in lessons
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
    // Applies a coupon code to calculate the discount rate
    applyCoupon() {
      if (this.couponCode === 'SAVE10') {
        this.discountRate = 10; // Set discount to 10%
        this.showModal('Successful', 'Coupon applied! You got 10% off.');
      } else {
        this.discountRate = 0; // Reset discount if coupon is invalid
        this.showModal('Unsuccessful', 'Invalid coupon code.');
      }
    },
    // Validates the name input using a regex pattern
    validateName() {
      // Allows letters and spaces only
      const nameRegex = /^[A-Za-z\s]+$/;
      this.nameError = !nameRegex.test(this.name);
    },
    // Validates the phone input using a regex pattern
    validatePhone() {
      // Allows digits only
      const phoneRegex = /^[0-9]+$/;
      this.phoneError = !phoneRegex.test(this.phone);
    },
    // Submits the order and clears the cart
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
              this.name = '';
              this.phone = '';
              this.cart = [];
              this.couponCode = '';
              this.showCart = false;
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
