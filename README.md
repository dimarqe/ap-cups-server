# ap-cups-server

The above is a restful api being done for an ongoing project.


Below is a general description of the project and its requirements


Description:

Cups is a local coffee shop that provides a relaxing getaway in the middle of the city for the disabled community. 
They are also a wonderful example of a Social Enterprise Boost Initiative 
(https://www.micaf.gov.jm/msme-initiatives/social-enterprise-boost-initiative-sebi) 
similar to DeafCan coffee (https://www.deafcancoffee.com/ | https://youtu.be/gGYq0ASoEPM ). 
Kat, the manager, has been encouraged by her mentor to establish another store at 95 Moolean Avenue in the heart of 
Montego Bay. Kat would like to encourage an empowering environment through self service. Your consulting team providing 
pro bono services has considered to incorporate Artificial Intelligence through Computer Vision and Speech Processing 
to accomplish this. The touch-screen self service kiosk will allow customers to order their favourite treats and 
verify using their Digital Id.


Requirements:

1.As a store manager, I should be able to add a new menu item to be ordered by customers. 
  Each menu item has a name, category (beverage, snack, daily surprise), stock quantity, cost, 
  system generated id, photo, photo of the American Sign Language (ASL) representation and audio recording of the 
  item name in English. (See testing samples for coffee, tea and hamburger : http://bit.ly/38xYmgz )
 
2.As a store manager,I should be able to access a list of all menu items and access all media (photos and audio).

3.As a store manager, I should be able to update the stock quantity of a menu item.

4.As a store manager, I should be able to update the cost of a menu item.

5.As a store manager, I should be able to remove an existing menu item from the system.

6.As a customer, I should be able to create a self service account using my first name, last name and digital id. 
  Each account is awarded $500 by default. A digital id may be:A password
  An image capture of the individual doing a signature move (think #usainbolt : http://bit.ly/2RHCNnd  ) (minimum: upload image and match)
  A voice recording (minimum: upload mp3 and match)

7.As a customer, I should be able to search for a menu item using:
  Text input (minimum: user should be able to type)
  Image/Video Input (minimum: upload photo of American Sign Language)
  Speech/Audio Input (minimum: upload mp3 of audio recording)
  
8.As a customer, I should be able to make an order for several items. Each order should have my first name and 
  quantity of each item chosen.

9.As a customer, I should be able to access the details (quantity of each item, unit cost of each item and total cost) 
  of my order for confirmation

10.As a customer, I should be able to cancel my order.

11.As a customer, I should be able to confirm my order by providing my digital id. 
   A customer should have three (3) chances to provide their correct digital id before the order is cancelled.

12.As a store manager, I should be able to view a chart showing the total sales (in dollars) for each menu item.
