"use client";

import { createClient } from "@/utils/supabase/client";
import { redirect } from "next/navigation";
import { StreamerList } from "@/components/streamer-list";
import { Navbar } from "@/components/ui/navbar";
import Image from 'next/image';
import Slider from "react-slick";
import { useEffect, useState } from 'react';
import { Smartphone, ShoppingBag, Camera, Gamepad, Mic, Coffee, Settings, DollarSign, Calendar, MapPin } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AvailabilityFilter } from "@/components/availability-filter";
import { format, startOfDay, endOfDay } from 'date-fns';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Slider as UISlider } from "@/components/ui/slider";
import Select from 'react-select';
import { indonesianCities } from '@/lib/constants/indonesia-cities';
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

// Import slick carousel styles
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Add type definitions for react-slick
declare module 'react-slick' {}

const categories = [
  { name: 'Tech', icon: Smartphone, color: 'bg-blue-500' },
  { name: 'Fashion', icon: ShoppingBag, color: 'bg-pink-500' },
  { name: 'Beauty', icon: Camera, color: 'bg-purple-500' },
  { name: 'Gaming', icon: Gamepad, color: 'bg-green-500' },
  { name: 'Music', icon: Mic, color: 'bg-yellow-500' },
  { name: 'Lifestyle', icon: Coffee, color: 'bg-red-500' },
];

interface ScheduleData {
  streamer_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface ActiveScheduleData {
  streamer_id: number;
  schedule: string;
}

interface DayOffData {
  streamer_id: number;
  date: string;
}

interface AvailabilityMap {
  [streamerId: number]: {
    regularSchedule: { [day: number]: { start_time: string; end_time: string }[] };
    activeSchedule: { [date: string]: any[] };
    daysOff: string[];
  };
}

// Add this helper function at the top of the file, after imports
function formatRupiah(value: string | number): string {
  const number = typeof value === 'string' ? parseInt(value) : value;
  return `Rp ${number.toLocaleString('id-ID')}`;
}

// Add this function to handle the input formatting
function handlePriceInputChange(
  e: React.ChangeEvent<HTMLInputElement>, 
  setter: React.Dispatch<React.SetStateAction<string>>
) {
  const value = e.target.value.replace(/[^0-9]/g, '');
  if (value === '' || /^\d+$/.test(value)) {
    setter(value);
  }
}

// Add this type near your other interfaces
interface CityOption {
  value: string;
  label: string;
}

// Add this constant for Indonesian weekday names
const INDONESIAN_WEEKDAYS = {
  0: 'Min',
  1: 'Sen',
  2: 'Sel',
  3: 'Rab',
  4: 'Kam',
  5: 'Jum',
  6: 'Sab'
};

export default function ProtectedPage() {
  const [user, setUser] = useState<any>(null);
  const [streamers, setStreamers] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [streamerAvailability, setStreamerAvailability] = useState<any>({});
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [selectedLocation, setSelectedLocation] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();

      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('Error fetching user:', userError);
        redirect("/sign-in");
        return;
      }

      setUser(user);

      const { data: streamersData, error: streamersError } = await supabase
        .from('streamers')
        .select('id, first_name, last_name, platform, category, rating, price, image_url, bio, location, user_id, video_url');

      if (streamersError) {
        console.error('Error fetching streamers:', streamersError);
        return;
      }

      setStreamers(streamersData || []);

      // Fetch streamer availability
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('streamer_schedule')
        .select('streamer_id, day_of_week, start_time, end_time, is_available');

      const { data: activeSchedulesData, error: activeSchedulesError } = await supabase
        .from('streamer_active_schedules')
        .select('streamer_id, schedule');

      const { data: daysOffData, error: daysOffError } = await supabase
        .from('streamer_day_offs')
        .select('streamer_id, date');

      if (scheduleError || activeSchedulesError || daysOffError) {
        console.error('Error fetching streamer availability:', scheduleError || activeSchedulesError || daysOffError);
      } else {
        const availabilityMap = processAvailabilityData(scheduleData, activeSchedulesData, daysOffData);
        setStreamerAvailability(availabilityMap);
      }
    };

    fetchData();
  }, []);

  const handleFilterChange = (value: string) => {
    setFilter(value);
  };

  const handleCategoryFilter = (category: string) => {
    setCategoryFilter(category === categoryFilter ? '' : category);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setter(value);
    }
  };

  const carouselImages = [
    "/images/salda2.png",
    "/images/salda2.png",
    "/images/salda2.png",
    "/images/salda2.png",
    "/images/salda2.png",
    // Add more image paths as needed
  ];

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  const filteredStreamers = streamers.filter((streamer) => {
    const lowercasedFilter = filter.toLowerCase();
    const matchesTextFilter = 
      streamer.first_name.toLowerCase().includes(lowercasedFilter) ||
      streamer.last_name.toLowerCase().includes(lowercasedFilter) ||
      streamer.platform.toLowerCase().includes(lowercasedFilter) ||
      streamer.category.toLowerCase().includes(lowercasedFilter) ||
      streamer.location.toLowerCase().includes(lowercasedFilter) ||
      streamer.bio.toLowerCase().includes(lowercasedFilter);
    
    const matchesCategoryFilter = categoryFilter ? streamer.category === categoryFilter : true;
    const matchesPriceFilter = 
      (!minPrice || streamer.price >= parseInt(minPrice)) &&
      (!maxPrice || streamer.price <= parseInt(maxPrice));

    const matchesAvailability = !selectedDate ? true : (() => {
      const availability = streamerAvailability[streamer.id];
      if (!availability) return false;

      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const dayOfWeek = selectedDate.getDay();

      // Check if it's not a day off
      if (availability.daysOff.includes(dateStr)) return false;

      // Check active schedule for this specific date
      if (availability.activeSchedule[dateStr]?.length > 0) return true;

      // Check regular schedule for this day of week
      return availability.regularSchedule[dayOfWeek]?.length > 0;
    })();

    const matchesLocationFilter = !selectedLocation || 
      streamer.location.toLowerCase() === selectedLocation.toLowerCase();

    return matchesTextFilter && matchesCategoryFilter && matchesPriceFilter && 
           matchesAvailability && matchesLocationFilter;
  });

  function getSlotTimes(slot: string): [string, string] {
    switch (slot) {
      case 'morning': return ['06:00:00', '11:59:59'];
      case 'afternoon': return ['12:00:00', '17:59:59'];
      case 'evening': return ['18:00:00', '23:59:59'];
      case 'night': return ['00:00:00', '05:59:59'];
      default: return ['00:00:00', '23:59:59'];
    }
  }

  function processAvailabilityData(
    scheduleData: ScheduleData[],
    activeSchedulesData: ActiveScheduleData[],
    daysOffData: DayOffData[]
  ): AvailabilityMap {
    const availabilityMap: AvailabilityMap = {};

    scheduleData.forEach(({ streamer_id, day_of_week, start_time, end_time, is_available }) => {
      if (!availabilityMap[streamer_id]) {
        availabilityMap[streamer_id] = { regularSchedule: {}, activeSchedule: {}, daysOff: [] };
      }
      if (!availabilityMap[streamer_id].regularSchedule[day_of_week]) {
        availabilityMap[streamer_id].regularSchedule[day_of_week] = [];
      }
      if (is_available) {
        availabilityMap[streamer_id].regularSchedule[day_of_week].push({ start_time, end_time });
      }
    });

    activeSchedulesData.forEach(({ streamer_id, schedule }) => {
      const parsedSchedule = JSON.parse(schedule);
      Object.entries(parsedSchedule).forEach(([date, slots]) => {
        if (!availabilityMap[streamer_id].activeSchedule[date]) {
          availabilityMap[streamer_id].activeSchedule[date] = [];
        }
        availabilityMap[streamer_id].activeSchedule[date] = slots as any[];
      });
    });

    daysOffData.forEach(({ streamer_id, date }) => {
      if (availabilityMap[streamer_id]) {
        availabilityMap[streamer_id].daysOff.push(date);
      }
    });

    return availabilityMap;
  }

  return (
    <div className="w-full overflow-x-hidden">
      <Navbar onFilterChange={handleFilterChange} />
      
      {/* Category Filter - Updated for mobile */}
      <div className="sticky top-16 bg-white z-40 border-b border-gray-200 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="relative w-full">
            <div className="flex overflow-x-auto scrollbar-hide py-4 gap-4 md:gap-6 w-full">
              {categories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => handleCategoryFilter(category.name)}
                  className={`flex flex-col items-center min-w-[64px] transition-all duration-200 ${
                    categoryFilter === category.name 
                      ? 'transform scale-105' 
                      : 'hover:scale-105'
                  }`}
                >
                  <div className={`p-2 rounded-full mb-1.5 
                    ${categoryFilter === category.name 
                      ? 'text-red-600' 
                      : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <category.icon size={20} strokeWidth={1.5} />
                  </div>
                  <span className={`text-xs whitespace-nowrap ${
                    categoryFilter === category.name 
                      ? 'font-semibold text-red-600 border-b-2 border-red-600' 
                      : 'text-gray-600'
                  }`}>
                    {category.name}
                  </span>
                </button>
              ))}
              
              {/* Filter Buttons */}
              <div className="flex gap-2 ml-2">
                {/* Price Range Filter */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 
                      hover:bg-gray-50 transition-all duration-200">
                      <DollarSign size={18} className="text-gray-600" />
                      <span className="text-sm text-gray-600 whitespace-nowrap">
                        Range Harga
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4">
                    <div className="space-y-4">
                      <h4 className="font-medium">Select Price Range</h4>
                      <div className="space-y-6">
                        <div className="relative pt-6">
                          <UISlider
                            defaultValue={[0, 1000000]}
                            max={1000000}
                            step={10000}
                            value={[
                              parseInt(minPrice || '0'),
                              parseInt(maxPrice || '1000000')
                            ]}
                            onValueChange={(values: number[]) => {
                              setMinPrice(values[0].toString());
                              setMaxPrice(values[1].toString());
                            }}
                            className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:bg-white [&_[role=slider]]:border-2 [&_[role=slider]]:border-slate-900"
                          />
                          <div className="absolute -top-2 left-0 right-0 flex justify-between text-xs text-slate-500">
                            <span>Min</span>
                            <span>Max</span>
                          </div>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>{formatRupiah(minPrice || '0')}</span>
                          <span>{formatRupiah(maxPrice || '1000000')}</span>
                        </div>
                        <div className="flex justify-between items-center gap-4">
                          <div className="flex-1">
                            <Label htmlFor="top-min-price" className="text-xs">Min Price</Label>
                            <Input
                              id="top-min-price"
                              type="text"
                              placeholder="Rp 0"
                              value={formatRupiah(minPrice || '0')}
                              onChange={(e) => handlePriceInputChange(e, setMinPrice)}
                              className="w-full mt-1"
                            />
                          </div>
                          <div className="flex-1">
                            <Label htmlFor="top-max-price" className="text-xs">Max Price</Label>
                            <Input
                              id="top-max-price"
                              type="text"
                              placeholder="Rp 1.000.000"
                              value={formatRupiah(maxPrice || '1000000')}
                              onChange={(e) => handlePriceInputChange(e, setMaxPrice)}
                              className="w-full mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Location Filter */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 
                      hover:bg-gray-50 transition-all duration-200">
                      <MapPin size={18} className="text-gray-600" />
                      <span className="text-sm text-gray-600 whitespace-nowrap">
                        {selectedLocation ? 
                          indonesianCities.find(city => city.value === selectedLocation)?.label : 
                          'Location'}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-4">
                    <div className="space-y-4">
                      <h4 className="font-medium">Select Location</h4>
                      <Select
                        options={indonesianCities}
                        placeholder="Select city..."
                        value={indonesianCities.find(city => city.value === selectedLocation)}
                        onChange={(option) => {
                          const cityOption = option as CityOption;
                          setSelectedLocation(cityOption?.value || '');
                        }}
                        classNames={{
                          control: (state) => 
                            'border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md',
                          menu: () => 'bg-white dark:bg-gray-800 rounded-md shadow-lg',
                          option: (state) => 
                            `px-3 py-2 ${state.isFocused ? 'bg-gray-100 dark:bg-gray-700' : ''}`,
                        }}
                      />
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Date Filter */}
                <AvailabilityFilter 
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                />
              </div>
            </div>
            
            {/* Gradient Fade - adjusted for mobile */}
            <div className="absolute right-0 top-0 h-full w-12 md:w-24 bg-gradient-to-l from-white pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Content - Updated for mobile */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Carousel - Updated for mobile */}
          <div className="w-full mb-6 md:mb-10">
            <Slider {...settings}>
              {carouselImages.map((image, index) => (
                <div key={index} className="outline-none px-1">
                  <Image
                    src={image}
                    alt={`Carousel image ${index + 1}`}
                    width={1200}
                    height={400}
                    objectFit="cover"
                    className="rounded-lg w-full"
                  />
                </div>
              ))}
            </Slider>
          </div>
          
          <hr className="border-t border-gray-200 my-6 md:my-8" />

          {/* Headings - Updated for mobile */}
          <h2 className="text-2xl md:text-3xl mb-2 text-gray-800 first-letter:text-3xl md:first-letter:text-4xl px-2 md:px-0">
            Salda Top Streamer
          </h2>
          
          <hr className="border-t border-gray-200 my-4 md:my-5" />

          {/* StreamerList - Updated for mobile */}
          <div className="px-2 md:px-4 lg:px-6">
            <StreamerList initialStreamers={filteredStreamers} filter={filter} />
          </div>
        </div>
      </div>
    </div>
  );
}
