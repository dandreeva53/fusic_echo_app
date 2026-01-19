'use client';

import { useState } from 'react';
import Image from 'next/image';


type Chapter = {
  id: string;
  number: string;
  title: string;
  content: JSX.Element;
};

export default function Knowledge() {
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);

  const chapters: Chapter[] = [
    {
      id: 'ch1',
      number: '1',
      title: 'The FUSIC – Heart Study',
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">The FUSIC – Heart Study</h2>
          
          <p>These should ideally be performed in level 2/3 patients, but up to 5 healthy volunteers can be included. Aim to include all the windows, but at least 2 are mandatory for an adequate scan.</p>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">These standard views are:</h3>
            <ul className="list-disc ml-6 space-y-1">
              <li>Parasternal Long axis</li>
              <li>Parasternal Short axis</li>
              <li>Apical</li>
              <li>Subcostal</li>
              <li>Pleural</li>
            </ul>
          </div>

          <p className="italic">These will be explained in more detail later</p>

          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Each FUSIC heart study aims to answer 5 key questions:</h3>
            <ol className="list-decimal ml-6 space-y-1">
              <li>Is the Left Ventricle dilated or significantly impaired?</li>
              <li>Is the Right Ventricle dilated or significantly impaired?</li>
              <li>What is the filling status? Is there low preload (hypovolemia)?</li>
              <li>Is there any pericardial effusion?</li>
              <li>Is there any pleural effusion?</li>
            </ol>
          </div>
        </div>
      ),
    },
    {
      id: 'ch2',
      number: '2',
      title: 'Standard Windows & Anatomy',
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Standard Windows & Anatomy</h2>
          
          <p>This chapter aims to describe the common positions used to find the main 5 windows used in FUSIC heart scanning in TTE, the relative anatomy of the window and what information you can aim to identify using this view.</p>

          <h3 className="text-xl font-semibold mt-6">Patient Positioning</h3>
          <p>TTE is traditionally performed in the left lateral tilt position, the aim is to displace the heart laterally so it lies closer to the chest wall and improve imaging. Ribs and sternum that protect our vulnerable hearts from trauma also protect it from the prying beams of the ultrasound probe.</p>
          
          <p>Optimal positioning is not always possible in all critical care patients but you should try and optimise the patients where possible as it often results in significantly improved image quality. By elevating the left arm so the left hand is behind the patient's head the rib spaces are widened.</p>

          <div className="flex justify-center mb-8">
          <Image
            src="/Figure 1.png"
            alt="Figure 1"
            width={800}
            height={800}
            className="mx-auto"
          />
          </div>

          <h3 className="text-xl font-semibold mt-6">I. Parasternal Long Axis</h3>
          <p>This forms the starting point for most echo exams. The probe is placed in the 3rd-5th intercostal space as close to the sternal edge as possible. All probes have some system to annotate the orientation of the probe. This should be facing the patient's right shoulder when you begin.</p>
          
          <div className="flex justify-center mb-8">
          <Image
            src="/Figure 2.png"
            alt="Figure 2"
            width={800}
            height={800}
            className="mx-auto"
          />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold">Measurements</h4>
            <p>The only measurement that is suggested in the parasternal long axis is the LVEDD. A value of &gt;6cm would be suggestive of a severely dilated Left Ventricle.</p>
          </div>

          <h3 className="text-xl font-semibold mt-6">II. Parasternal Short Axis View</h3>
          <p>From the position of the parasternal long axis if you rotate your probe 60-90 degrees clockwise the beam will rotate to view the heart in the short axis.</p>
          
          <div className="flex justify-center mb-8">
          <Image
            src="/Figure 3.png"
            alt="Figure 3"
            width={800}
            height={800}
            className="mx-auto"
          />
          </div>

          <div className="ml-4 space-y-2 mt-3">
            <p><strong>A. Level of the aortic valve:</strong> The aortic valve is located in the middle of your picture with the right heart wrapped around.</p>
            <p><strong>B. Mitral valve level:</strong> Refers to the base of the left ventricle. This view can be referred to as the fish mouth view. Not a standard FUSIC view.</p>
            <p><strong>C. Mid Ventricular (Papillary) level:</strong> This is the main parasternal short axis view to be obtained as part of FUSIC heart assessment.</p>
            <p><strong>D. Apical level:</strong> Harder to obtain. Not required for FUSIC heart.</p>
          </div>

          <h3 className="text-xl font-semibold mt-6">III. Apical Four Chamber</h3>
          <p>This is the view achieved by placing the probe where you would feel for the apex beat. The pointer is normally located between the 2 o'clock and 3 o'clock position.</p>
          
          <div className="bg-blue-50 p-4 rounded-lg mt-3">
            <h4 className="font-semibold">Measurement</h4>
            <p>The only measurement in the Apical 4-chamber is the Tricuspid Annular Planar Excursion (TAPSE).</p>
          </div>

          <div className="flex justify-center mb-8">
          <Image
            src="/Figure 4.png"
            alt="Figure 4"
            width={800}
            height={800}
            className="mx-auto"
          />
          </div>

          <h3 className="text-xl font-semibold mt-6">IV. Subcostal Imaging</h3>
          <p>Subcostal imaging is achieved with a supine patient by holding the probe from above, rather than below to allow greater range of movement against the patient. The probe is placed with the pointer to the left just below the xiphoid process.</p>
          
          <p className="mt-2">This window proves very useful in critical care imaging in all contexts. The pericardial anchor onto the diaphragm means that sedated and ventilated patients with high PEEP levels often have excellent subcostal images due to the caudal displacement of the heart.</p>

          <div className="flex justify-center mb-8">
          <Image
            src="/Figure 5.png"
            alt="Figure 5"
            width={800}
            height={800}
            className="mx-auto"
          />
          </div>

          <h3 className="text-xl font-semibold mt-6">V. Pleural Views</h3>
          <p>The final view of FUSIC is the pleural views which look at both lung bases for pleural effusions. This is equivalent to the PLAPS points in the Blue protocol in Lung Ultrasound.</p>

          <div className="flex justify-center mb-8">
          <Image
            src="/Figure 6.png"
            alt="Figure 6"
            width={800}
            height={800}
            className="mx-auto"
          />
          </div>
        </div>

      ),
    },
    {
      id: 'ch3',
      number: '3',
      title: 'Physics and Knobology',
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Physics and Knobology</h2>
          
          <p>The basic understanding of the physics of ultrasound and how to adjust the process to optimise your images will improve your images when scanning.</p>

          <h3 className="text-xl font-semibold mt-6">Physics</h3>
          <p>Echocardiography uses ultrasound, which is a wavelength at a frequency above the human hearing (20 Hz - 20 kHz). Sound is a mechanical wave transmitted through a medium by displacement of particles within the medium.</p>

          <div className="bg-blue-50 p-4 rounded-lg mt-3">
            <h4 className="font-semibold mb-2">Sound waves are defined by:</h4>
            <ul className="space-y-2">
              <li><strong>Frequency:</strong> the number of oscillations per unit of time. Most ultrasound machines operate between 2-18 MHz. Higher frequency = greater resolution but lower penetration.</li>
              <li><strong>Wavelength (λ):</strong> the distance between two identical points on adjacent cycles</li>
              <li><strong>Velocity (v):</strong> the speed and direction of travel</li>
            </ul>
            <p className="mt-2 italic">They are related by the formula: V = f λ</p>
            <p className="mt-2">In soft body tissues the sound wave travels at about 1500 m/s (compared with 300 m/s in air).</p>
          </div>

          <h3 className="text-xl font-semibold mt-6">Tissue Effect on Ultrasound</h3>

          <div className="flex justify-center mb-8">
          <Image
            src="/Figure 7.png"
            alt="Figure 7"
            width={800}
            height={800}
            className="mx-auto"
          />
          </div>

          <p>As sound waves pass through tissue, they undergo processes called reflection, scattering or refraction:</p>
          
          <ul className="list-disc ml-6 space-y-2 mt-2">
            <li><strong>Reflection:</strong> When sound passes through tissue and hits a boundary of different densities, some incident energy is reflected to the probe. About 0.1% is reflected at blood, muscle, fat interfaces.</li>
            <li><strong>Refraction:</strong> If sound waves hit the interface at an angle other than 0 or 90 degrees there is a change in direction of the wave.</li>
            <li><strong>Scattering:</strong> When ultrasound waves encounter smaller structures, echoes are generated equally in all directions.</li>
            <li><strong>Attenuation:</strong> The energy of ultrasound is lost the further into the tissue. At 5 MHz, 50% of transmitted energy is lost every 2cm. Therefore only 12.5% reaches 6cm or only 0.1% at 20cm.</li>
          </ul>

          <div className="bg-gray-50 p-4 rounded-lg mt-4">
            <p><strong>Gain:</strong> Brightness of image depends on the amount of reflected ultrasound. Adjusting the gain increases the volume of the returned signal.</p>
            <p className="mt-2"><strong>Time gain compensation (TGC):</strong> TGC enhances the returning signal from deeper structures.</p>
          </div>

          <h3 className="text-xl font-semibold mt-6">Resolution</h3>
          <ul className="space-y-2 mt-2">
            <li><strong>Temporal resolution:</strong> Overall image quality with respect to time. Shallow, narrow sectors will enhance temporal resolution.</li>
            <li><strong>Axial resolution:</strong> The ability to discern two points in line with the ultrasound beam as being separate. Increasing ultrasound frequency increases axial resolution.</li>
            <li><strong>Lateral resolution:</strong> The ability to discern two points perpendicular to the ultrasound beam as being separate. Lost as depth increases due to widening of the ultrasound beam.</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6">Machine Basics</h3>
          <p>The probes used in echocardiography are called a phased array probe.</p>
          
          <div className="space-y-3 mt-4">
            <div className="bg-gray-50 p-3 rounded">
              <h4 className="font-semibold">Width</h4>
              <p>The wider your scan angle, the slower the frame rate. Optimize to ensure maximal resolution.</p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded">
              <h4 className="font-semibold">Depth</h4>
              <p>Ensure your image fills all the screen rather than having large amounts of dead space. By optimising the image depth, it ensures the maximal resolution is achieved.</p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded">
              <h4 className="font-semibold">Gain</h4>
              <p>The power of the echo machine. Optimal gain is when the blood pool (the fluid filled chambers within the heart) is pure black. If over gained, it will appear grey.</p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded">
              <h4 className="font-semibold">Focus</h4>
              <p>Ensure the focus is approximately two thirds down in your image for best results (i.e., in line with inter ventricular septum in PLAX or the annular ring in apical four chamber).</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'ch4',
      number: '4',
      title: 'Left Ventricular Assessment',
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Left Ventricular Assessment</h2>
          
          <p>The left ventricle forms the main pumping chamber for ejecting blood from the pulmonary circulation to generate the flow in the systemic arterial circulation. A complex machine, it contracts in at least three different planes to achieve the increase in pressure required to generate its stroke volume.</p>

          <div className="bg-green-50 p-4 rounded-lg mt-4">
            <h3 className="font-semibold mb-2">In FUSIC there are two questions related to the left ventricle:</h3>
            <ol className="list-decimal ml-6">
              <li>Is the Left Ventricle dilated?</li>
              <li>Is the Left Ventricle significantly impaired?</li>
            </ol>
          </div>

          <h3 className="text-xl font-semibold mt-6">Left Ventricular Dilation</h3>
          <p>Assessed in the parasternal long axis, the left ventricular cavity diameter is measured from one endocardial border to another. For the purpose of FUSIC, the left ventricle is considered dilated if <strong>GREATER than 6 cm in diastole</strong>.</p>

          <div className="bg-blue-50 p-4 rounded-lg mt-3">
            <h4 className="font-semibold mb-2">To measure the left ventricle diameter:</h4>
            <ul className="list-disc ml-6 space-y-1">
              <li>Record a video loop of a parasternal long axis. Scroll the loop backwards until the mitral valve leaflet tips are just about to open (mid diastole)</li>
              <li>Identify your measuring tool on your echo machine (either annotated measurement or use a simple calliper)</li>
              <li>Click on the endocardial border of the left ventricle on the inter-ventricular septum</li>
              <li>Draw a line across the ventricular cavity, parallel with the base of the mitral valve, ending at the endocardial border of the posterior wall of the left ventricle</li>
              <li>For FUSIC, dilated is considered greater than 6cm</li>
            </ul>
          </div>

          <div className="flex justify-center mb-8">
          <Image
            src="/Figure 8.png"
            alt="Figure 8"
            width={800}
            height={800}
            className="mx-auto"
          />
          </div>

          <h3 className="text-xl font-semibold mt-6">Left Ventricular Function</h3>
          <p>The systolic function of the left ventricle is complex and difficult to measure, even if an experienced echo cardiographer. Various quantitative techniques exist looking to estimate the ejection fraction. For FUSIC, these techniques are avoided as they are fraught with technical pitfalls and complications.</p>
          
          <p className="mt-2">Instead, the emphasis is placed on visual, qualitative examination. The question is: <strong>Is it severely impaired?</strong> (approximately EF &lt;30%)</p>

          <p className="italic mt-3">FUSIC heart mentions awareness of regional wall abnormalities however there is no requirement to assess these in FUSIC. There are many resources online that can help you with more information if you are interested.</p>
        
          <div className="flex justify-center mb-8">
          <Image
            src="/Figure 9.png"
            alt="Figure 9"
            width={800}
            height={800}
            className="mx-auto"
          />
          </div>
        </div>
      ),
    },
    {
      id: 'ch5',
      number: '5',
      title: 'Right Ventricular Assessment',
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Right Ventricular Assessment</h2>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">For FUSIC, the assessment of the right ventricle forms two components:</h3>
            <ol className="list-decimal ml-6">
              <li>Is the right ventricle dilated?</li>
              <li>Is the right ventricle significantly impaired?</li>
            </ol>
          </div>

          <h3 className="text-xl font-semibold mt-6">Right Ventricular Dilation</h3>
          <p>Unlike the left ventricle, the right ventricle is simple in construction but complex in function. The right ventricle wraps around the septal wall of the left ventricle and is thin walled in structure. It tails away at the apex so that the normal apex is composed entirely of the left ventricle.</p>
          
          <p className="mt-2">The right ventricle can be seen in all windows using TTE, however, most of the assessments are usually made using the apical window.</p>
          
          <p className="mt-2 font-semibold">Rule of thumb: The right ventricle should be less than 2/3 of the diameter of the left ventricle.</p>

          <div className="bg-blue-50 p-4 rounded-lg mt-4">
            <h4 className="font-semibold mb-2">Features supporting RV dilation:</h4>
            <ul className="list-disc ml-6 space-y-2">
              <li>The apex is made up of components of both left and right ventricles (normally only LV)</li>
              <li>RV changes from a slim ellipse shape to a rectangular dilated appearance</li>
              <li>The interventricular septum behaviour changes. As the pressure in the right heart increases in pathological conditions, the septum will flatten, replacing the traditional circular appearance of the left ventricle with a "D" shape.</li>
            </ul>
          </div>

          <h3 className="text-xl font-semibold mt-6">Right Ventricular Function - TAPSE</h3>
          <p>Whilst the LV is complex and contracts in multiple planes, the right ventricle is simpler to assess. The free wall of the RV acts as a piston, contracting to increase the pressure and generate an ejection fraction.</p>
          
          <p className="mt-2">To assess the RV systolic function, the displacement of the base of the free wall is measured as it moves from diastole to systole.</p>

          <div className="bg-blue-50 p-4 rounded-lg mt-3">
            <h4 className="font-semibold">TAPSE (Tricuspid Annular Plane Systolic Excursion)</h4>
            <p className="mt-2">Normal if <strong>greater than 16 mm</strong>.</p>
            <p className="mt-2">To measure TAPSE, the heart is imaged using an apical four chamber view. A calliper is placed through the lateral tricuspid annulus and using M Mode the tissue displacement can be measured. A single line is chosen, which reflects the tricuspid annulus. The height difference is measured from its peak to trough.</p>
          </div>

          <div className="flex justify-center mb-8">
          <Image
            src="/Figure 10.png"
            alt="Figure 10"
            width={800}
            height={800}
            className="mx-auto"
          />
          </div>
        </div>
      ),
    },
    {
      id: 'ch6',
      number: '6',
      title: 'Volume Assessment',
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Volume Assessment</h2>
          
          <p>In FUSIC the volume assessment is in answer to the question: <strong>Is there evidence of low preload (hypovolemia)?</strong></p>

          <p className="mt-2">Using echocardiography for volume assessment can be useful, however it is important to understand how that assessment is best appropriately done. In the setting of acute resuscitation, the question is likely to be about low preload i.e due to vasodilation due to sepsis or overt hypovolaemia (dehydration or blood loss) as a cause of shock.</p>

          <p className="mt-2">Occasionally it is difficult to decide, and the better question might be about whether the patient will tolerate fluid. Beyond this acute period, it is more often the aim to predict fluid responsiveness (an increase in Cardiac Output of 15% after a bolus of 500ml).</p>

          <p className="mt-2">Signs that may be suggestive of fluid tolerance include kissing papillary muscles and a collapsing IVC. However IVC assessment differs in spontaneously ventilating or mechanically ventilated patients - not ideal for the ICU population.</p>

          <h3 className="text-xl font-semibold mt-6">How to View the IVC</h3>
          <p>Start at the subcostal view and get the vessel in its long axis (cross-section can be used). The IVC is usually found by rotating anticlockwise and looking a little deeper into the abdomen. A normal vessel has solid white edges. Follow it throughout the respiratory cycle, keeping the hepatic vein in view – this may require small movements.</p>
          
          <p className="mt-2">Measurement should be taken 1-2cm below the entrance to the right atrium, if possible, often just distal to the hepatic vein.</p>

          <div className="space-y-3 mt-4">
            <div className="bg-blue-50 p-3 rounded">
              <h4 className="font-semibold">Will the patient tolerate fluid?</h4>
              <p className="mt-1">A non-dilated right ventricle and an IVC diameter of &lt;2cm with 50% collapse suggests it's likely to be safe to give a fluid bolus without raising pulmonary venous pressure significantly.</p>
            </div>

            <div className="bg-blue-50 p-3 rounded">
              <h4 className="font-semibold">Is there volume overload?</h4>
              <p className="mt-1">Subtle overload is difficult to detect unless pulmonary oedema is present. RV dilatation is suggestive but is non-specific. Septal flattening with preserved RV function is a better sign. Lung ultrasound is also useful, showing 'B-line predominance' in the presence of excess lung water.</p>
            </div>

            <div className="bg-blue-50 p-3 rounded">
              <h4 className="font-semibold">Will my patient benefit from fluid?</h4>
              <p className="mt-1"><strong>Spontaneous breathing:</strong> There are few sensitive and specific markers of fluid responsiveness in the spontaneously breathing patient. A cardiac output rise of 10% after 90 seconds of passive leg raising is the most useful.</p>
              <p className="mt-2"><strong>Not spontaneously breathing:</strong> Evidence for both a passive leg raise assessment and the dispensability index, which is beyond the assessment of FUSIC.</p>
            </div>
          </div>

          <div className="flex justify-center mb-8">
          <Image
            src="/Figure 11.png"
            alt="Figure 11"
            width={800}
            height={800}
            className="mx-auto"
          />
          </div>
        </div>
      ),
    },
    {
      id: 'ch7',
      number: '7',
      title: 'Thoracic Fluid Collections',
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Thoracic Fluid Collections</h2>
          
          <h3 className="text-xl font-semibold">Anatomy</h3>
          <p>The pericardium consists of 2 layers. The visceral pericardium is attached to the surface of both ventricles and extends to the pulmonary veins and the systemic vessels. At this point, the visceral pericardium reflects to become the parietal pericardium.</p>
          
          <p className="mt-2">The pericardium covers the right atrium (RA) and reflects around the superior and inferior vena cava (SVC & IVC). It therefore follows that the juxta cardiac portions of the caval vessels, main pulmonary artery and ascending aorta and descending aorta lie within the pericardial sac. The left atrium (LA) lies outside the pericardial sac, which is important to remember when considering tamponade physiology.</p>
          
          <p className="mt-2">The pericardial sac is a potential space, and in health contains around 5-10 ml of fluid.</p>

          <h3 className="text-xl font-semibold mt-6">Characteristics of Pericardial Effusions</h3>
          <p>Pericardial effusions can be seen on all the traditional views that are taught in FUSIC and should be assessed in each view. They usually appear as echo free spaces around the heart, the size of which are directly proportional to the amount of fluid present.</p>

          <p className="mt-2">Effusions tend to be most prominent in the more dependent areas, and frequently appear in the inferior atrio-ventricular groove.</p>

          <p className="mt-2 italic">Of note, it is normal to see a small amount of fluid in this area, a general rule of thumb is if it disappears in diastole then it is physiological and does not represent a pericardial effusion. It therefore follows that any fluid seen around the heart in diastole is abnormal.</p>

          <div className="flex justify-center mb-8">
          <Image
            src="/Figure 12.png"
            alt="Figure 12"
            width={800}
            height={800}
            className="mx-auto"
          />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg mt-4">
            <h4 className="font-semibold mb-2">How can you tell it is a pericardial effusion?</h4>
            <p>It can be very easy to confuse a pericardial effusion with a pleural effusion, or a pericardial fat pad, but this will be avoided if one remembers the anatomy.</p>
            <p className="mt-2">In the parasternal long axis view, both pleural and pericardial effusions appear as echo-free spaces inferior to the heart. The discriminating factor is the descending aorta.</p>
            <p className="mt-2 font-semibold">Key point: If the fluid collection "tucks in" behind the descending aorta it is pericardial, if it does not it is likely pleural.</p>
            <p className="mt-2">In patients with high body fat content the epicardial fat pad can appear similar to pericardial fluid, however this has a much more granular appearance which can help distinguish it and it is usually small and normally is anterior to the heart.</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mt-4">
            <h4 className="font-semibold mb-2">Pericardial Effusion Size</h4>
            <p className="mb-2">The pericardial effusion size can be measured at end diastole perpendicular to the pericardium and myocardium:</p>
            <ul className="list-disc ml-6">
              <li>Small: &lt;0.5cm</li>
              <li>Moderate: 0.5-2cm</li>
              <li>Large: &gt;2cm</li>
            </ul>
            
            <h4 className="font-semibold mt-4 mb-2">Appearance can help distinguish cause:</h4>
            <ul className="list-disc ml-6">
              <li>Simple effusion – uniform, anechoic</li>
              <li>Exudative/fibrinous – stranding/loculation</li>
              <li>Old blood – echogenic & grainy</li>
              <li>Acute blood – similar to simple serous effusion</li>
              <li>Purulent effusion – echogenic</li>
            </ul>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg mt-4 border-l-4 border-yellow-500">
            <h4 className="font-semibold mb-2">Tamponade</h4>
            <p>FUSIC is not designed to teach you the echo signs of tamponade - just to identify the presence of a pericardial effusion. Tamponade can occur depending on the speed of accumulation in very different size effusions. Tamponade remains a clinical diagnosis and any concerning new pericardial effusion should be escalated.</p>
            <p className="mt-2"><strong>Early signs of pericardial tamponade:</strong> IVC dilated, not collapsing and RA collapse</p>
            <p><strong>Late sign:</strong> RV early diastolic collapse → significant haemodynamic compromise</p>
            <p><strong>Very late sign:</strong> LV/LA collapse</p>
          </div>

          <h3 className="text-xl font-semibold mt-6">Pleural Effusions</h3>
          <p>Large pleural effusions can cause severe respiratory compromise and even haemodynamic compromise as it continues to grow and can cause a tension effect. FUSIC is designed to identify and quantify the effusions present as a cause for respiratory failure.</p>
          
          <p className="mt-2">Left pleural effusions can be seen in the Parasternal Long axis view. But are mostly assessed in the pleural views which are positioned in the PLAPS point. This is the point in the BLUE protocol that looked for posterolateral alveolar pleural syndrome (PLAPS). This is PLAPS point at the intersection of the posterior axillary line and a rib space between the 8th and 12th ribs.</p>

          <div className="flex justify-center mb-8">
          <Image
            src="/Figure 13.png"
            alt="Figure 13"
            width={800}
            height={800}
            className="mx-auto"
          />
          </div>

          <div className="flex justify-center mb-8">
          <Image
            src="/Figure 14.png"
            alt="Figure 14"
            width={800}
            height={800}
            className="mx-auto"
          />
          </div>
        </div>
      ),
    },
    {
      id: 'ch8',
      number: '8',
      title: 'Peri-arrest Echo',
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Peri-arrest Echo</h2>
          
          <p>Focused echo can be used during cardiac arrest and fits into the ALS algorithm at the pulse check. Usually, the only place to assess the patient is via the subcostal view and limited to only 10 seconds.</p>

          <p className="mt-3">Echo during cardiac arrest can help distinguish between:</p>
          <ul className="list-disc ml-6 space-y-2 mt-2">
            <li><strong>True PEA:</strong> Coordinated electrical activity is seen on the monitor but there is no cardiac movement on echo and no palpable pulse</li>
            <li><strong>Pseudo-PEA:</strong> Coordinated electrical activity on the monitor and cardiac activity on echo but with no palpable pulse</li>
          </ul>

          <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500 mt-6">
            <h3 className="font-semibold mb-3">Resus Council Recommendations for USS Imaging During ALS:</h3>
            <ul className="list-disc ml-6 space-y-2">
              <li>Only skilled operators should use intra-arrest point-of-care ultrasound (POCUS)</li>
              <li>POCUS must not cause additional or prolonged interruptions in chest compressions</li>
              <li>POCUS may be useful to diagnose treatable causes of cardiac arrest such as cardiac tamponade and pneumothorax</li>
              <li>Right ventricular dilation in isolation during cardiac arrest should not be used to diagnose massive pulmonary embolism</li>
              <li>Do not use POCUS for assessing contractility of the myocardium as a sole indicator for terminating CPR</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'ch9',
      number: '9',
      title: 'Governance',
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Governance</h2>
          
          <p>FUSIC Curriculum Indications & limitations of focused echo.</p>

          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">The FUSIC protocol is designed to assess five key questions:</h3>
            <ol className="list-decimal ml-6 space-y-1">
              <li>Is the Left Ventricle dilated or significantly impaired?</li>
              <li>Is the Right Ventricle dilated or significantly impaired?</li>
              <li>What is the filling status? Is there low preload (hypovolemia)?</li>
              <li>Is there any pericardial effusion?</li>
              <li>Is there any pleural effusion?</li>
            </ol>
          </div>

          <p>It is important from a professional safety and training perspective that only these clinical outcomes are encompassed by requests for echo, and requests outside this domain should be referred for expert echo by trained personnel.</p> 
          
          <p>It is important that your echo findings are communicated to the team and documented in the patient notes. Many suggested templates exist, however, the FUSIC heart logbook forms is an excellent demonstration of how to record the findings of the echo study. The FUSIC protocol is designed to detect normal and severely impaired hearts, using the values in the teaching programme.
          All scans should be documented to a level that allows you to identify the patient subsequently, whilst ensuring you respect all aspects of the Data Protection Act when archiving patient data. A healthy working relationship with your cardiology department is helpful for any critical care echo programme. Beyond acting as a resource for reviewing scans with unexpected findings outside the scope of FUSIC, it serves as an effective way of quality assuring your echo abilities.</p> 
          
          <p>You may also be able to access the echo archiving system used to store your images in appropriate facilities to ensure your machine can be run efficiently but have evidence of scans performed should they be required subsequently.
          Understand your governance during training and be aware how to get contemporaneous feedback and support of your pictures where you work is crucial.</p>

          <p>UCLH critical care FUSIC department does not support non accredited images being used to manage patient care, outside a governance process.</p>
        </div>
      ),
    },
    {
      id: 'ch10',
      number: '10',
      title: 'Cheat sheets',
      content: (
        <div className="space-y-4">
          <div className="flex justify-center mb-8">
            <Image
              src="/CS PLAX.png"
              alt="CS PLAX"
              width={800}
              height={800}
              className="mx-auto"
            />
          </div>

          <div className="flex justify-center mb-8">
            <Image
              src="/CS PSAX.png"
              alt="CS PSAX"
              width={800}
              height={800}
              className="mx-auto"
            />
          </div>

          <div className="flex justify-center mb-8">
            <Image
              src="/CS A4CX.png"
              alt="CS A4CX"
              width={800}
              height={800}
              className="mx-auto"
            />
          </div>

          <div className="flex justify-center mb-8">
            <Image
              src="/CS SC4C.png"
              alt="CS SC4C"
              width={800}
              height={800}
              className="mx-auto"
            />
          </div>

          <div className="flex justify-center mb-8">
            <Image
              src="/CS SC IVC.png"
              alt="CS SC IVC"
              width={800}
              height={800}
              className="mx-auto"
            />
          </div>

          <div className="flex justify-center mb-8">
            <Image
              src="/CS Lung bases.png"
              alt="CS Lung bases"
              width={800}
              height={800}
              className="mx-auto"
            />
          </div>

        </div>
      ),
    },
    {
      id: 'ch11',
      number: '11',
      title: 'Other resources',
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Other resources</h2>
          
          <p>This has hopefully been a helpful if brief overview of some of the key learning that you would need to assist you in making the most out of your course and onward FUSIC journey. There are many resources that you can find to complement the webinars and this course handbook, below are some examples.</p>

          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">
              ICE BLU:{' '}
              <a
                href="https://www.e-lfh.org.uk/programmes/icu-echoultrasound/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800"
              >
                https://www.e-lfh.org.uk/programmes/icu-echoultrasound/
              </a>
            </h3>

            <p>
              It is recommended that you register on eLFH and take the ICU BLU eLearning. Ultrasound physics is not fully covered on the course, as it is too large a topic to cover in just one lecture. This eLearning nicely covers all principles to inform and enhance your practice. In addition, it is essential for the final sign-off of the accreditation.
            </p>
          </div>


          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">
              FOCUS: {' '}
              <a
                href="http://pie.med.utoronto.ca/TTE/TTE_content/focus.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800"
              >
                http://pie.med.utoronto.ca/TTE/TTE_content/focus.html
              </a> 
            </h3>
            <ol className="list-decimal ml-6 space-y-1">
            <p>This Canadian hospital has a really useful echo website to learn about sono-anatomy and surface anatomy for echocardiography.</p>
            </ol>
          </div>

          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">
              Critical care echo: {' '}
              <a
                href="https://www.criticalcareecho.com/resources"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800"
              >
                 https://www.criticalcareecho.com/resources
              </a> 
            </h3>
            <ol className="list-decimal ml-6 space-y-1">
            <p>South London has produced this set of resources and videos you can look at and produced our cheat sheet at the back.</p>
            </ol>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">
              FUSIC-SY: {' '}
              <a
                href="https://fusic-sy.co.uk/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800"
              >
                 https://fusic-sy.co.uk/
              </a> 
            </h3>
            <ol className="list-decimal ml-6 space-y-1">
            <p>South Yorkshire has this pretty comprehensive set of resources that are great to look at. Both their own and things curated from around the web.</p>
            </ol>
          </div>
        </div>
      ),
    },
    {
      id: 'ch12',
      number: '12',
      title: 'Disclaimer',
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Disclaimer</h2>
          
          <p>These chapters were written from a range of open access resources and amalgamation of excellent work from fellow POCUS enthusiasts, and we acknowledge all the hard work required to create them. UCLH FUSIC heart course is run as a charitable enterprise and no profits are made from the courses or this document. We aim to support the growthand development of those interested in POCUS.</p>
        </div>
      ),
    }
  ]
  const current = chapters.find((c) => c.id === selectedChapter) ?? chapters[0];

  return (
    <div className="flex gap-6 p-6">
      {/* Left nav */}
      <aside className="w-72 shrink-0">
        <h1 className="text-xl font-bold mb-4">Knowledge</h1>

        <div className="space-y-2">
          {chapters.map((ch) => {
            const active = ch.id === current.id;
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => setSelectedChapter(ch.id)}
                className={[
                  'w-full text-left rounded-lg border p-3 transition',
                  active ? 'bg-black text-white' : 'bg-white hover:bg-gray-50',
                ].join(' ')}
              >
                <div className="text-sm opacity-80">Chapter {ch.number}</div>
                <div className="font-medium">{ch.title}</div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 min-w-0">
        <div className="max-w-3xl">{current.content}</div>
      </main>
    </div>
  );
}