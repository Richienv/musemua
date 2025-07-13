"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Star, Clock, MapPin, Calendar, Phone, Mail, Instagram, Camera, Heart, Award } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from '@/lib/utils';
import { userService, type CompleteUserProfile } from '@/services/user-service';
import { Navbar } from "@/components/ui/navbar";
import { CollaborationRequestModal } from "@/components/collaboration-request-modal";
import { CollaborationSuccessModal } from "@/components/collaboration-success-modal";

export default function MUAPortfolioPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<CompleteUserProfile | null>(null);
  const [isCollaborationModalOpen, setIsCollaborationModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    const loadUser = async () => {
      if (params?.id) {
        const userData = await userService.getUserById(params.id as string);
        setUser(userData);
      }
    };
    
    loadUser();
  }, [params?.id]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">User tidak ditemukan</h2>
          <p className="text-gray-600 mb-4">User yang Anda cari tidak ada.</p>
          <Button onClick={() => router.back()}>Kembali</Button>
        </div>
      </div>
    );
  }

  // If user is MUSE (has characteristics but no muaPortfolio), show MUSE layout
  if (user.characteristics && !user.muaPortfolio) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-[100] bg-white border-b border-gray-100">
          <Navbar />
        </header>

        <div className="mt-[80px]">
          <div className="text-center py-4 text-sm font-medium text-gray-900 border-b border-gray-100">
            {user.display_name.toUpperCase()}
          </div>

          {/* MUSE Portfolio Layout (Original Model Style) */}
          <div className="max-w-7xl mx-auto">
            <div className="w-full md:flex md:min-h-[70vh]">
              <div className="w-full md:w-1/2 relative h-[60vh] md:h-auto md:order-2">
                <div className="relative h-full">
                  <Image
                    src={user.image_url || '/placeholder-image.jpg'}
                    alt={user.display_name}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>

              <div className="w-full md:w-1/2 p-6 md:p-12 flex flex-col justify-center bg-gray-50 md:order-1">
                <h1 className="text-4xl md:text-7xl font-light mb-8 md:mb-16 tracking-wider text-black leading-none text-center md:text-left">
                  {user.display_name.toUpperCase()}
                </h1>
                
                <div className="space-y-6 md:space-y-8">
                  <div className="border-l-2 border-black pl-4 md:pl-6">
                    <h3 className="text-xs font-bold tracking-widest text-gray-600 mb-4 md:mb-6 uppercase">Measurements</h3>
                    <div className="grid grid-cols-2 gap-x-4 md:gap-x-8 gap-y-3 md:gap-y-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">Height</span>
                        <span className="text-base md:text-lg font-light">{user.characteristics.height}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">Bust</span>
                        <span className="text-base md:text-lg font-light">{user.characteristics.bust}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">Waist</span>
                        <span className="text-base md:text-lg font-light">{user.characteristics.waist}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">Hips</span>
                        <span className="text-base md:text-lg font-light">{user.characteristics.hips}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-l-2 border-black pl-4 md:pl-6">
                    <h3 className="text-xs font-bold tracking-widest text-gray-600 mb-4 md:mb-6 uppercase">Features</h3>
                    <div className="grid grid-cols-2 gap-x-4 md:gap-x-8 gap-y-3 md:gap-y-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">Hair</span>
                        <span className="text-base md:text-lg font-light">{user.characteristics.hair_color}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">Eyes</span>
                        <span className="text-base md:text-lg font-light">{user.characteristics.eye_color}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 md:pt-8">
                    <Button 
                      size="lg" 
                      className="w-full md:w-auto bg-black text-white hover:bg-gray-800 px-8 py-4"
                      onClick={() => setIsCollaborationModalOpen(true)}
                    >
                      COLLABORATE
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Portfolio Gallery Section for MUSE */}
          <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-6">
              <h2 className="text-4xl font-light text-center mb-16 tracking-wider text-black">PORTFOLIO</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                  <div key={i} className="group cursor-pointer">
                    <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
                      <Image
                        src={`${user.image_url || '/placeholder-image.jpg'}&seed=${i}&q=90&w=400&h=600`}
                        alt={`${user.display_name} portfolio ${i}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Polaroid Style Section */}
          <section className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-6">
              <h2 className="text-4xl font-light text-center mb-16 tracking-wider text-black">BEHIND THE SCENES</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="group cursor-pointer">
                    <div className="bg-white p-4 shadow-lg transform rotate-1 group-hover:rotate-0 transition-transform duration-300">
                      <div className="relative aspect-square bg-gray-100 overflow-hidden mb-4">
                        <Image
                          src={`${user.image_url || '/placeholder-image.jpg'}&seed=${i + 10}&q=90&w=300&h=300`}
                          alt={`Behind the scenes ${i}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-light text-gray-600">Behind the scenes #{i}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Instagram Showcase Section */}
          <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-4 tracking-tight">INSTAGRAM</h2>
                <p className="text-gray-600">@{user.display_name.toLowerCase().replace(' ', '_')}</p>
                <p className="text-lg font-medium text-gray-900">{user.instagram_followers} followers</p>
              </div>
              
              <div className="grid grid-cols-3 md:grid-cols-6 gap-1 mb-8">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
                  <div key={i} className="aspect-square bg-gray-100 relative group cursor-pointer">
                    <Image
                      src={`${user.image_url || '/placeholder-image.jpg'}&seed=${i + 20}&q=90&w=300&h=300`}
                      alt={`Instagram ${i}`}
                      fill
                      className="object-cover group-hover:opacity-80 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <Instagram className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
                {/* More Button as Last Square */}
                <div className="aspect-square bg-white relative group cursor-pointer border border-gray-200 hover:border-black transition-colors">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-light tracking-widest text-black group-hover:text-gray-600 transition-colors">
                      MORE
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Collaboration Section */}
          <section className="py-20 bg-black text-white">
            <div className="max-w-4xl mx-auto px-6 text-center">
              <h2 className="text-4xl font-light mb-6 tracking-wider">LET'S WORK TOGETHER</h2>
              <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
                Available for fashion shows, photoshoots, brand collaborations, and creative projects.
              </p>
              
              <div className="grid md:grid-cols-3 gap-8 mb-12">
                <div className="text-center">
                  <div className="text-3xl font-light mb-2">{user.projects_completed}+</div>
                  <div className="text-xs font-medium tracking-widest text-gray-400 uppercase">Projects Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-light mb-2">{user.clients_reached}+</div>
                  <div className="text-xs font-medium tracking-widest text-gray-400 uppercase">Clients Served</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-light mb-2">24H</div>
                  <div className="text-xs font-medium tracking-widest text-gray-400 uppercase">Response Time</div>
                </div>
              </div>

              <div className="space-y-4">
                <Button 
                  size="lg" 
                  className="bg-white text-black hover:bg-gray-100 px-8 py-4 text-lg font-medium mr-4"
                  onClick={() => setIsCollaborationModalOpen(true)}
                >
                  Start Collaboration
                </Button>
                <div className="text-sm text-gray-400 mt-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Mail className="w-4 h-4" />
                    <span>{user.display_name.toLowerCase().replace(' ', '.')}@email.com</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Instagram className="w-4 h-4" />
                    <span>@{user.display_name.toLowerCase().replace(' ', '_')}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Modals for MUSE */}
        <CollaborationRequestModal
          isOpen={isCollaborationModalOpen}
          onClose={() => setIsCollaborationModalOpen(false)}
          onSuccess={() => {
            setIsCollaborationModalOpen(false);
            setIsSuccessModalOpen(true);
          }}
          muaName={user.display_name}
          muaImage={user.image_url || '/placeholder-image.jpg'}
        />

        <CollaborationSuccessModal
          isOpen={isSuccessModalOpen}
          onClose={() => setIsSuccessModalOpen(false)}
          muaName={user.display_name}
          muaImage={user.image_url || '/placeholder-image.jpg'}
        />
      </div>
    );
  }

  // If no muaPortfolio, show error for MUA
  if (!user.muaPortfolio) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">MUA Portfolio tidak ditemukan</h2>
          <p className="text-gray-600 mb-4">Portfolio untuk MUA ini belum tersedia.</p>
          <Button onClick={() => router.back()}>Kembali</Button>
        </div>
      </div>
    );
  }

  const portfolio = user.muaPortfolio;
  const beforeAfterImages = portfolio?.beforeAfterImages || [];
  const categories = ["All", ...Array.from(new Set(beforeAfterImages.map(img => img.category)))];
  const filteredImages = selectedCategory === "All" 
    ? beforeAfterImages 
    : beforeAfterImages.filter(img => img.category === selectedCategory);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-[100] bg-white border-b border-gray-100">
        <Navbar />
      </header>

      <div className="mt-[80px]">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] bg-black text-white overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src={user.image_url || '/placeholder-image.jpg'}
              alt={user.display_name}
              fill
              className="object-cover opacity-30"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/80" />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 flex items-center min-h-[90vh]">
            <div className="grid lg:grid-cols-2 gap-12 items-center w-full">
              {/* Left: Text Content */}
              <div className="space-y-8">
                <div>
                  <p className="text-sm font-medium tracking-widest text-gray-300 mb-4 uppercase">
                    Professional Makeup Artist
                  </p>
                  <h1 className="text-5xl lg:text-7xl font-light mb-6 tracking-wide leading-none">
                    {user.display_name.toUpperCase()}
                  </h1>
                  <p className="text-xl lg:text-2xl font-light text-gray-300 mb-8 max-w-md">
                    {portfolio?.tagline || 'Professional Makeup Artist'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 mb-8">
                  {(portfolio?.specialties || []).slice(0, 3).map((specialty, index) => (
                    <span key={index} className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-sm font-medium">
                      {specialty}
                    </span>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    size="lg" 
                    className="bg-white text-black hover:bg-gray-100 px-8 py-4 text-lg font-medium"
                    onClick={() => setIsCollaborationModalOpen(true)}
                  >
                    Book Consultation
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-white text-white hover:bg-white hover:text-black px-8 py-4 text-lg"
                  >
                    View Portfolio
                  </Button>
                </div>

                {/* Quick Stats */}
                <div className="flex gap-8 pt-8 border-t border-white/20">
                  <div>
                    <p className="text-3xl font-light">{portfolio?.years_experience || 0}+</p>
                    <p className="text-sm text-gray-300">Years Experience</p>
                  </div>
                  <div>
                    <p className="text-3xl font-light">{user.projects_completed}+</p>
                    <p className="text-sm text-gray-300">Happy Clients</p>
                  </div>
                  <div>
                    <p className="text-3xl font-light">5.0</p>
                    <p className="text-sm text-gray-300">Average Rating</p>
                  </div>
                </div>
              </div>

              {/* Right: Before/After Showcase */}
              <div className="relative">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-300 mb-2">BEFORE</p>
                      <div className="aspect-[3/4] relative overflow-hidden rounded-lg">
                        <Image
                          src={beforeAfterImages[0]?.before_image_url || user.image_url || '/placeholder-image.jpg'}
                          alt="Before transformation"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-300 mb-2">AFTER</p>
                      <div className="aspect-[3/4] relative overflow-hidden rounded-lg border-2 border-white/20">
                        <Image
                          src={beforeAfterImages[0]?.after_image_url || user.image_url || '/placeholder-image.jpg'}
                          alt="After transformation"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-light mb-6 tracking-wide">SERVICES & PRICING</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Professional makeup artistry services tailored to your special moments and creative vision.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {(portfolio?.services || []).map((service, index) => (
                <div key={index} className="group bg-white border border-gray-200 rounded-lg p-6 hover:border-black transition-colors duration-300">
                  <div className="mb-4">
                    <h3 className="text-xl font-medium mb-2">{service.name}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{service.description}</p>
                  </div>
                  
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      {service.duration}
                    </div>
                    <div className="text-2xl font-light text-black">
                      {service.price}
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full group-hover:bg-black group-hover:text-white transition-colors"
                    onClick={() => setIsCollaborationModalOpen(true)}
                  >
                    Book Now
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Portfolio Gallery */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-light mb-6 tracking-wide">TRANSFORMATION PORTFOLIO</h2>
              <p className="text-gray-600 max-w-2xl mx-auto mb-8">
                Witness the artistry and transformation through our before and after gallery.
              </p>

              {/* Category Filter */}
              <div className="flex flex-wrap justify-center gap-4">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={cn(
                      "px-6 py-2 rounded-full text-sm font-medium transition-colors",
                      selectedCategory === category
                        ? "bg-black text-white"
                        : "bg-white text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredImages.map((item, index) => (
                <div key={index} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                  <div className="grid grid-cols-2">
                    <div className="relative aspect-[3/4]">
                      <Image
                        src={item.before_image_url}
                        alt="Before"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute top-4 left-4 bg-black/70 text-white px-2 py-1 rounded text-xs">
                        BEFORE
                      </div>
                    </div>
                    <div className="relative aspect-[3/4]">
                      <Image
                        src={item.after_image_url}
                        alt="After"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute top-4 right-4 bg-white/90 text-black px-2 py-1 rounded text-xs">
                        AFTER
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">{item.category}</span>
                      <Camera className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-light mb-6 tracking-wide">CLIENT TESTIMONIALS</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Read what our satisfied clients have to say about their experience.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(portfolio?.testimonials || []).map((testimonial, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  
                  <p className="text-gray-700 mb-4 italic">"{testimonial.review}"</p>
                  
                  <div className="flex items-center gap-3">
                    {testimonial.client_image_url && (
                      <div className="w-10 h-10 relative rounded-full overflow-hidden">
                        <Image
                          src={testimonial.client_image_url}
                          alt={testimonial.client_name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{testimonial.client_name}</p>
                      <p className="text-sm text-gray-500">{testimonial.event}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact & Booking */}
        <section className="py-20 bg-black text-white">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-light mb-6 tracking-wide">LET'S CREATE MAGIC TOGETHER</h2>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Ready to transform your look? Get in touch to discuss your vision and book your appointment.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Info */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-medium mb-6">Get In Touch</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <span>{user.location}, Indonesia</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <span>+62 812-3456-7890</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <span>{user.display_name.toLowerCase().replace(' ', '.')}@email.com</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Instagram className="w-5 h-5 text-gray-400" />
                      <span>@{user.display_name.toLowerCase().replace(' ', '_')} ({user.instagram_followers})</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-4">Certifications</h3>
                  <div className="space-y-2">
                    {(portfolio?.certifications || []).map((cert, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm text-gray-300">{cert}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
                <h3 className="text-xl font-medium mb-6">Send a Message</h3>
                <form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input 
                      placeholder="Your Name" 
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    />
                    <Input 
                      placeholder="Your Email" 
                      type="email"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    />
                  </div>
                  <Input 
                    placeholder="Event Date" 
                    type="date"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                  <Textarea 
                    placeholder="Tell me about your vision..." 
                    rows={4}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                  <Button 
                    className="w-full bg-white text-black hover:bg-gray-100"
                    onClick={() => setIsCollaborationModalOpen(true)}
                  >
                    Send Message
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Modals */}
      <CollaborationRequestModal
        isOpen={isCollaborationModalOpen}
        onClose={() => setIsCollaborationModalOpen(false)}
        onSuccess={() => {
          setIsCollaborationModalOpen(false);
          setIsSuccessModalOpen(true);
        }}
        muaName={user.display_name}
        muaImage={user.image_url || '/placeholder-image.jpg'}
      />

      <CollaborationSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        muaName={user.display_name}
        muaImage={user.image_url || '/placeholder-image.jpg'}
      />
    </div>
  );
}